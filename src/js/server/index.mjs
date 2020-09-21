import { execSync, exec as exec_} from 'child_process';
import fs from 'fs';
import path from 'path';
import crypt from 'crypto';
import util from 'util';

const exec = util.promisify(exec_);

const MOVIES_EXT = ['.mp4', '.m4v', 'mov'];
let context;

const init = async () => {
    context = buildContext();
    validateContext();
    showMessage(context);
    const db = [];
    await handleDir('/', db).catch(e => {
        console.warn(e);
    });
    resetLine();
    buildIndexPage(db);
};

const buildContext = () => {
    const result = {
        LMP_PORT: process.env.LMP_PORT ?? 8080,
        LMP_TMP: process.env.LMP_TMP ?? '/tmp',
    }
    if (!process.env.LMP_ROOT) {
        throwError("Not found LMP_ROOT environment variable");
    }
    result.LMP_ROOT = process.env.LMP_ROOT;
    try {
        result.LMP_FFMPEG = execSync('which ffmpeg').toString().trim();
    } catch (e) {
        throwError("Not found `ffmpeg` command");
    }
    return result;
};

const validateContext = () => {
    if (!fs.existsSync(context.LMP_ROOT)) {
        throwError(`"${context.LMP_ROOT}" doesn't exist`);
    }
    const stat = fs.statSync(context.LMP_ROOT);
    if (!stat.isDirectory()) {
        throwError(`"${context.LMP_ROOT}" isn't directory`);
    }
};

const handleDir = async (relativePath, db) => {
    showOneline(relativePath);
    const absoluteDirPath = `${context.LMP_ROOT}${relativePath}`;
    const files = fs.readdirSync(absoluteDirPath);
    for (const file of files) {
        const relativeFilePath = `${relativePath}${file}`;
        if (hasMovieExt(file)) {
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
    const absolutePath = `${context.LMP_ROOT}${relativePath}`;
    if (!fs.existsSync(absolutePath)) {
        return false;
    }
    const stat = fs.statSync(absolutePath);
    return stat.isDirectory();
};

const handleMovie = async (relativePath) => {
    showOneline(relativePath);
    const absolutePath = `${context.LMP_ROOT}${relativePath}`;
    const datPath = `${absolutePath}.json`;
    const dat = loadDat(datPath);
    let needToSave = false;
    needToSave |= handleMeta(dat, absolutePath);
    needToSave |= await handleThumbnails(dat, absolutePath, relativePath).catch(e => {
        console.warn(e);
    });
    if (needToSave) {
        saveDat(datPath, dat);
    }
    const legacyDatPath = `${absolutePath}.dat`;
    if (fs.existsSync(legacyDatPath)) {
        fs.unlinkSync(legacyDatPath);
    }
    return {
        ...dat,
        path: relativePath
    };
}

const loadDat = (path) => {
    if(!fs.existsSync(path)) {
        return {};
    }
    const stat = fs.statSync(path);
    if (!stat.isFile()) {
        return {};
    }
    return JSON.parse(fs.readFileSync(path));
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
    if (thumbnails.length > 0) {
        return false;
    }
    const tmpDirPath = `${context.LMP_TMP}/${md5hex(absolutePath)}`;
    if (fs.existsSync(tmpDirPath)) {
        fs.rmdirSync(tmpDirPath, { recursive: true });
    }
    fs.mkdirSync(tmpDirPath);
    const lastFrame = parseInt(dat.meta.length);
    const lastFrameLength = lastFrame.toString().length;
    const iid = setInterval(() => {
        fs.readdir(tmpDirPath, (err, files) => {
            showOneline(`${relativePath} [${files.length.toString().padStart(lastFrameLength, ' ')}/${lastFrame}]`);
        });
    }, 200);
    const command = `${context.LMP_FFMPEG} -skip_frame nokey -i "${absolutePath}" -vf scale=240:-1,fps=1 -q:v 10 "${tmpDirPath}/%05d.jpg"`
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

const saveDat = (path, dat) => {
    fs.writeFileSync(path, JSON.stringify(dat));
};

const buildIndexPage = (db) => {
    const srcPath = path.resolve('src/index.html');
    const srcHtml = fs.readFileSync(srcPath).toString();
    const distPath = path.resolve('dist/index.html');
    const distHtml = srcHtml.replace('$DB', JSON.stringify(db));
    fs.writeFileSync(distPath, distHtml);
};

const throwError = (message) => {
    throw `
#### ERROR ################################################################
${message}
###########################################################################
`;
}

const showMessage = (message) => {
    console.log('==== Local Movie Player ===================================================');
    console.log(message);
    console.log('===========================================================================');
};

const resetLine = () => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
}

const showOneline = (message) => {
    resetLine();
    process.stdout.write(message);
};

export {
    init
};
