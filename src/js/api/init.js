const fs = require('fs');
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
            onMessage(`[File] ${file}`);
            const path = `${dir}/${file}`;
            const stat = fs.statSync(path);
            if (isMovie(file)) {
                const dat = loadDat(path);
                if (dat.size !== stat.size) {
                    dat.size = stat.size;
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
            onFinished();
        }
    } catch (err) {
        onError(JSON.stringify({err, results}));
    }
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
