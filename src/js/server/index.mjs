import { execSync, exec as exec_} from 'child_process';
import fs from 'fs';
import path from 'path';
import crypt from 'crypto';
import util from 'util';
import express from 'express';
import { initContext, context, getAbsolutePath, hasDat, loadDat, saveDat, showMessage, getArgs }from './common.mjs';
import api from './api.mjs';

const exec = util.promisify(exec_);

const MOVIES_EXT = ['.mp4', '.m4v', 'mov'];

const init = async () => {
    initContext();
    const db = [];
    await handleDir('/', db).catch(e => {
        console.warn(e);
    });
    resetLine();
    saveDb(db);
    buildIndexPage();
    initApp();
};

const handleDir = async (relativePath, db) => {
    showOneline(relativePath, 6);
    const absoluteDirPath = getAbsolutePath(relativePath);
    const files = fs.readdirSync(absoluteDirPath);
    const args = getArgs();
    const skipNoDataMovie = args['skipNoDataMovie'] === 'true';
    for (const file of files) {
        const relativeFilePath = `${relativePath}${file}`;
        if (hasMovieExt(file)) {
            if (skipNoDataMovie && !hasDat(relativeFilePath)) {
                continue;
            }
            const movie = await handleMovie(relativeFilePath).catch(e => {
                console.warn(e);
            });
            db.push(movie);
        } else if (isDir(relativeFilePath)) {
            await handleDir(`${relativeFilePath}/`, db).catch(e => {
                console.warn(e);
            });
        }
    }
};

const hasMovieExt = (file) => {
    for (const ext of MOVIES_EXT) {
        if (file.endsWith(ext)) {
            return true;
        }
    }
    return false;
};

const isDir = (relativePath) => {
    const absolutePath = getAbsolutePath(relativePath);
    if (!fs.existsSync(absolutePath)) {
        return false;
    }
    const stat = fs.statSync(absolutePath);
    return stat.isDirectory();
};

const handleMovie = async (relativePath) => {
    showOneline(relativePath, 10);
    const absolutePath = getAbsolutePath(relativePath);
    const dat = loadDat(relativePath);
    let needToSave = false;
    needToSave |= handleStat(dat, absolutePath);
    needToSave |= handleMeta(dat, absolutePath);
    needToSave |= await handleThumbnails(dat, absolutePath, relativePath).catch(e => {
        console.warn(e);
    });
    if (needToSave) {
        saveDat(relativePath, dat);
    }
    const lastDotIndex = relativePath.lastIndexOf('.');
    const ext = relativePath.substring(lastDotIndex + 1);
    const lastSlashIndex = relativePath.lastIndexOf('/');
    const name = relativePath.substring(lastSlashIndex + 1, lastDotIndex);
    return {
        ...dat,
        path: relativePath,
        ext,
        name,
    };
}

const handleStat = (dat, path) => {
    const stat = dat.stat ?? {};
    if (stat.size && stat.displaySize) {
        return false;
    }
    const fileStat = fs.statSync(path);
    stat.size = fileStat.size;
    stat.displaySize = formatSize(stat.size);
    dat.stat = stat;
    return true;
};

const formatSize = (size) => {
    if (size >= 900*1000*1000) { // >= 0.9GB
        return `${(size / (1000*1000*1000)).toFixed(2)} GB`;
    } else if (size >= 900*1000) { // >= 0.9MB
        return `${(size / (900*1000)).toFixed(2)} MB`;
    } else if (size >= 900) { // >= 0.9KB
        return `${(size / 1000).toFixed(2)} KB`;
    } else {
        return size.toString();
    }
};

const handleMeta = (dat, path) => {
    const meta = dat.meta ?? {};
    if (meta.duration && meta.length && meta.width && meta.height) {
        return false;
    }
    const command = `${context.LMP_FFMPEG} -i "${path}" 2>&1 | cat`;
    const results = execSync(command).toString();
    results.split('\n').forEach(line => {
        if (line.includes('  Duration: ')) {
            const [duration, length] = handleMetaDuration(line);
            meta.duration = duration;
            meta.length = length;
        } else if (line.includes(': Video: ')) {
            const [width, height] = handleMetaVideo(line);
            meta.width = width;
            meta.height = height;
        }
    });
    dat.meta = meta;
    return true;
};

const handleMetaDuration = (line) => {
    const duration = line.trim().split(' ')[1].split(',')[0];
    const [hours, mins, secs] = duration.split(':');
    const length = parseInt(hours) * 3600 + parseInt(mins) * 60 + parseFloat(secs);
    return [formatDuration(duration), length];
};

const formatDuration = (duration) => {
    const [hhmmss] = duration.split('.');
    let result = hhmmss;
    let c = result.charAt(0);
    while (c === '0' || c === ':') {
        result = result.substr(1);
        c = result.charAt(0);
    }
    return result;
};

const handleMetaVideo = (line) => {
    const match = /, ([\d]{2,4})x([\d]{2,4})/.exec(line);
    const width = parseInt(match[1]);
    const height = parseInt(match[2]);
    return [width, height];
};

const handleThumbnails = async (dat, absolutePath, relativePath) => {
    const thumbnails = dat.thumbnails ?? [];
    const args = getArgs();
    if (args['forceThumbnailsUpdate'] !== 'true' && thumbnails.length > 0) {
        return false;
    }
    thumbnails.length = 0;
    const tmpDirPath = `${context.LMP_TMP}/${md5hex(absolutePath)}`;
    if (fs.existsSync(tmpDirPath)) {
        fs.rmdirSync(tmpDirPath, { recursive: true });
    }
    fs.mkdirSync(tmpDirPath);
    const lastFrame = parseInt(dat.meta.length);
    const lastFrameLength = lastFrame.toString().length;
    const keepLastWidth = 10 + 2 + lastFrameLength + 1 + lastFrameLength + 1;
    const iid = setInterval(() => {
        fs.readdir(tmpDirPath, (err, files) => {
            showOneline(`${relativePath} [${files.length.toString().padStart(lastFrameLength, ' ')}/${lastFrame}]`, keepLastWidth);
        });
    }, 200);
    const command = `${context.LMP_FFMPEG} -skip_frame nokey -i "${absolutePath}" -vf scale=480:-1,fps=1 -q:v 10 "${tmpDirPath}/%05d.jpg"`
    await exec(command).catch(e => {
        console.warn(e);
    });
    clearInterval(iid);
    for (let i = 1; i <= lastFrame; i+=30) {
        const imgPath = `${tmpDirPath}/${i.toString().padStart(5, '0')}.jpg`;
        if (!fs.existsSync(imgPath)) {
            break;
        }
        const base64 = fs.readFileSync(imgPath, {encoding: 'base64'});
        const thumbnail = `data:image/jpg;base64,${base64}`;
        thumbnails.push(thumbnail);
    }
    fs.rmdirSync(tmpDirPath, { recursive: true });
    dat.thumbnails = thumbnails;
    return true;
};

const md5hex = (str) => {
    const md5 = crypt.createHash('md5')
    return md5.update(str, 'binary').digest('hex');
};

const saveDb = (db) => {
    const resourcesDirPath = path.resolve('dist/resources');
    fs.mkdirSync(resourcesDirPath, { recursive: true });
    const dbPath = path.resolve('dist/resources/db.json');
    fs.writeFileSync(dbPath, JSON.stringify(db));
};

const buildIndexPage = (db) => {
    const srcPath = path.resolve('src/index.html');
    const srcHtml = fs.readFileSync(srcPath).toString();
    const distPath = path.resolve('dist/index.html');
    const distHtml = srcHtml
        .replace('$CONTEXT', JSON.stringify(context))
        .replace('$DB', JSON.stringify(db));
    fs.writeFileSync(distPath, distHtml);
};

const initApp = () => {
    const app = express();
    const url = `http://localhost${context.LMP_PORT === 80 ? '' : `:${context.LMP_PORT}`}`;
    app.use(express.json());
    app.use('/resources', express.static(path.resolve('dist/resources')));
    app.use('/movie', express.static(context.LMP_ROOT));
    app.get('/', (req, res) => {
        const indexPath = path.resolve('dist/index.html');
        const indexHtml = fs.readFileSync(indexPath).toString();
        res.set('Context-Type', 'text/html; charset=UTF-8');
        res.send(indexHtml);
    });
    app.post('/api/:action', api);
    app.listen(context.LMP_PORT, () => {
        showMessage(`Open ${url} on your browser\nCtrl+C to stop`);
    });
};

const resetLine = () => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
}

const terminalWidth = (()=> {
    return parseInt(process.stdout.columns);
})();

const getCharWidth = (char) => {
    const c = char.charCodeAt(0);
    if((c >= 0x00 && c < 0x81) || (c === 0xf8f0) || (c >= 0xff61 && c < 0xffa0) || (c >= 0xf8f1 && c < 0xf8f4)) {
        return 1;
    } else {
        return 2;
    }
};

const getStrWidth = (str) => {
    return [...str].reduce((prev, char) => {
        return prev + getCharWidth(char);
    }, 0);
};

const showOneline = (message, keepLastWidth = -1) => {
    resetLine();
    if (keepLastWidth === -1) {
        process.stdout.write(message);
        return;
    }
    const width = getStrWidth(message);
    if (width <= terminalWidth) {
        process.stdout.write(message);
        return;
    }
    const maxLeftWidth = terminalWidth - keepLastWidth - 4;
    let leftWidth = 0;
    let result = '';
    for (let i = 0; i < message.length && leftWidth < maxLeftWidth; i++) {
        const char = message.charAt(i);
        result += char;
        leftWidth += getCharWidth(char);
    }
    let rightWidth = 0;
    let rightStr = '';
    for (let i = message.length - 1; i >= 0 && rightWidth < keepLastWidth; i--) {
        const char = message.charAt(i);
        rightStr = char + rightStr;
        rightWidth += getCharWidth(char);
    }
    const dotsWidth = terminalWidth - leftWidth - rightWidth;
    result += '.'.repeat(dotsWidth);
    result += rightStr;
    process.stdout.write(result);
};

export {
    init
};
