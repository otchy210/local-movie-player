const fs = require('fs');
const { execSync } = require('child_process');
const express = require('express');
const { RESOURCE_PORT } = require('../const');

const MOVIES_EXT = ['.mp4', '.mov', '.m4v'];
const DEFAULT_DAT = {size:0, tags: []};

const isMovie = (file) => {
    for (const ext of MOVIES_EXT) {
        if (file.endsWith(ext)) {
            return true;
        }
    }
    return false;
}

const loadDat = (path) => {
    const datPath = `${path}.dat`;
    try {
        const stat = fs.statSync(datPath);
        if (!stat.isFile()) {
            return DEFAULT_DAT;
        }
        const dat = JSON.parse(fs.readFileSync(datPath));
        return dat;
    } catch (err) {
        return DEFAULT_DAT;
    }
}

const saveDat = (path, dat) => {
    const datPath = `${path}.dat`;
    fs.writeFileSync(datPath, JSON.stringify(dat));
}

const loadDir = (movieDir, dir, results, onMessage, onFinished, onError) => {
    try {
        onMessage(`[Dir] ${dir}`);
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const path = `${dir}/${file}`;
            const stat = fs.statSync(path);
            if (isMovie(file)) {
                onMessage(`[File] ${file}`);
                const dat = loadDat(path);
                let needToSave = false;
                if (dat.size !== stat.size) {
                    dat.size = stat.size;
                    needToSave = true;
                }
                if (!dat.length) {
                    const command = `ffmpeg -i "${path}" 2>&1 | grep "  Duration: "`;
                    const stdout = execSync(command).toString();
                    const duration = stdout.trim().split(' ')[1].split(',')[0];
                    dat.duration = duration;

                    const [hours, mins, secs] = duration.split(':');
                    const length = parseInt(hours) * 3600 + parseInt(mins) * 60 + parseFloat(secs);
                    dat.length = length;

                    needToSave = true;
                }
                if (!dat.width || !dat.height) {
                    const command = `ffmpeg -i "${path}" 2>&1 | grep ": Video: "`;
                    const stdout = execSync(command).toString();
                    const match = /, ([\d]{2,4})x([\d]{2,4})/.exec(stdout);
                    const width = parseInt(match[1]);
                    const height = parseInt(match[2]);
                    dat.width = width;
                    dat.height = height;
                    needToSave = true;
                }
                if (!dat.thumbnail) {
                    const imgPath = `${path}.jpg`;
                    const command = `ffmpeg -i "${path}" -ss 2 -vframes 1 -vf scale=600:-1 -f image2 -q:v 10 -y "${imgPath}"`;
                    execSync(command);
                    const base64 = fs.readFileSync(imgPath, {encoding: 'base64'});
                    dat.thumbnail = `data:image/jpg;base64,${base64}`;
                    needToSave = true;
                }
                if (needToSave) {
                    saveDat(path, dat);
                }
                const urlPath = path
                    .substr(movieDir.length)
                    .split('/')
                    .filter(name => name.length !== 0)
                    .map(encodeURIComponent)
                    .join('/');
                const meta = {...DEFAULT_DAT, ...dat, ...{path: urlPath, name: file.normalize()}};
                results.push(meta);
            } else if (stat.isDirectory()) {
                loadDir(movieDir, path, results, onMessage, onFinished, onError);
            }
        };
        if (movieDir === dir) {
            cleanTmpFiles(movieDir, results);
            onFinished();
        }
    } catch (err) {
        onError(JSON.stringify({err, results}));
    }
};

const cleanTmpFiles = (movieDir, results) => {
    results.forEach(meta => {
        const path = `${movieDir}/${decodeURIComponent(meta.path)}`;
        const imgPath = `${path}.jpg`;
        try {
            const stat = fs.statSync(imgPath);
            if (stat.isFile()) {
                fs.unlinkSync(imgPath);
            }
        } catch (e) {}
    })
};

const init = (ws, req) => {
    ws.on('message', (msg) => {
        const movieDir = req.query.movieDir;
        const results = [];
        const onMessage = (message) => {
            ws.send(JSON.stringify({status: 'loading', message}));
        };
        const onFinished = () => {
            const rsApp = express();
            rsApp.use(express.static(movieDir));
            rsApp.listen(RESOURCE_PORT, () => {
                console.log(`Resource server running on http://localhost:${RESOURCE_PORT}`);
            }).on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.log('An expected error happened. Ignoring.');
                    return;
                }
                console.error(err);
            });
            ws.send(JSON.stringify({status: 'finished', db: {list: results}}));
        };
        const onError = (message) => {
            ws.send(JSON.stringify({status: 'error', message}));
        };
        loadDir(movieDir, movieDir, results, onMessage, onFinished, onError);
    });
};

module.exports = {
    init,
    loadDir,
    RESOURCE_PORT
};
