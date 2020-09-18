import { execSync, exec as exec_} from 'child_process';
import fs from 'fs';
import crypt from 'crypto';
import util from 'util';

const exec = util.promisify(exec_);

const MOVIES_EXT = ['.mp4', '.m4v', 'mov'];
let context;

const init = async () => {
    context = buildContext();
    validateContext();
    showMessage(context);
    await handleDir('/').catch(e => {
        console.warn(e);
    });
};

const buildContext = () => {
    const result = {
        HTTP_PORT: process.env.HTTP_PORT ?? 8080,
        LOCAL_TMP: process.env.LOCAL_TMP ?? '/tmp',
    }
    if (!process.env.MOVIE_DIR) {
        throwError("Not found MOVIE_DIR environment variable");
    }
    result.MOVIE_DIR = process.env.MOVIE_DIR;
    try {
        result.FFMPEG = execSync('which ffmpeg').toString().trim();
    } catch (e) {
        throwError("Not found `ffmpeg` command");
    }
    return result;
};

const validateContext = () => {
    if (!fs.existsSync(context.MOVIE_DIR)) {
        throwError(`"${context.MOVIE_DIR}" doesn't exist`);
    }
    const stat = fs.statSync(context.MOVIE_DIR);
    if (!stat.isDirectory()) {
        throwError(`"${context.MOVIE_DIR}" isn't directory`);
    }
};

const handleDir = async (relativePath) => {
    console.log(relativePath);
    const absoluteDirPath = `${context.MOVIE_DIR}${relativePath}`;
    const files = fs.readdirSync(absoluteDirPath);
    for (const file of files) {
        const relativeFilePath = `${relativePath}${file}`;
        if (hasMovieExt(file)) {
            await handleMovie(relativeFilePath).catch(e => {
                console.warn(e);
            });
        } else if (isDir(relativeFilePath)) {
            await handleDir(`${relativeFilePath}/`).catch(e => {
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
    const absolutePath = `${context.MOVIE_DIR}${relativePath}`;
    if (!fs.existsSync(absolutePath)) {
        return false;
    }
    const stat = fs.statSync(absolutePath);
    return stat.isDirectory();
};

const handleMovie = async (relativePath) => {
    console.log(relativePath);
    const absolutePath = `${context.MOVIE_DIR}${relativePath}`;
    const datPath = `${absolutePath}.json`;
    const dat = loadDat(datPath);
    let needToSave = false;
    needToSave |= handleMeta(dat, absolutePath);
    needToSave |= await handleThumbnails(dat, absolutePath).catch(e => {
        console.warn(e);
    });
    if (needToSave) {
        saveDat(datPath, dat);
    }
    const legacyDatPath = `${absolutePath}.dat`;
    if (fs.existsSync(legacyDatPath)) {
        fs.unlinkSync(legacyDatPath);
    }
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
    const command = `${context.FFMPEG} -i "${path}" 2>&1 | cat`;
    const results = execSync(command).toString();
    results.split('\n').forEach(line => {
        if (line.includes('  Duration: ')) {
            const [duration, length] = handleDuration(line);
            meta.duration = duration;
            meta.length = length;
        } else if (line.includes(': Video: ')) {
            const [width, height] = handleVideo(line);
            meta.width = width;
            meta.height = height;
        }
    });
    dat.meta = meta;
    return true;
};

const handleDuration = (line) => {
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

const handleVideo = (line) => {
    const match = /, ([\d]{2,4})x([\d]{2,4})/.exec(line);
    const width = parseInt(match[1]);
    const height = parseInt(match[2]);
    return [width, height];
};

const handleThumbnails = async (dat, path) => {
    const thumbnails = dat.thumbnails ?? [];
    if (thumbnails.length > 0) {
        return false;
    }
    const tmpDirPath = `${context.LOCAL_TMP}/${md5hex(path)}`;
    if (fs.existsSync(tmpDirPath)) {
        fs.rmdirSync(tmpDirPath, { recursive: true });
    }
    fs.mkdirSync(tmpDirPath);
    const lastFrame = parseInt(dat.meta.length)
    const iid = setInterval(() => {
        fs.readdir(tmpDirPath, (err, files) => {
            console.log(`${files.length} / ${lastFrame}`);
        });
    }, 1000);
    const command = `${context.FFMPEG} -skip_frame nokey -i "${path}" -vf scale=240:-1,fps=1 -q:v 10 "${tmpDirPath}/%05d.jpg"`
    await exec(command).catch(e => {
        console.warn(e);
    });
    clearInterval(iid);
    for (let i = 1; i <= lastFrame; i+=30) {
        const imgPath = `${tmpDirPath}/${i.toString().padStart(5, '0')}.jpg`
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

export {
    init
};
