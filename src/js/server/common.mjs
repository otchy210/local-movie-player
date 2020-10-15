import { execSync } from 'child_process';
import fs from 'fs';

let context;
const initContext = () => {
    context = buildContext();
    validateContext();
    showMessage(context);
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

const getAbsolutePath = (relativePath) => {
    return `${context.LMP_ROOT}${relativePath}`;
};

const getDatPath = (relativePath) => {
    const absolutePath = getAbsolutePath(relativePath);
    return `${absolutePath}.json`;
};

const hasDat = (relativePath) => {
    const path = getDatPath(relativePath);
    if(!fs.existsSync(path)) {
        return false;
    }
    const stat = fs.statSync(path);
    if (!stat.isFile()) {
        return false;
    }
    return path;
};

const loadDat = (relativePath) => {
    const path = hasDat(relativePath);
    if (!path) {
        return {};
    }
    return JSON.parse(fs.readFileSync(path));
};

const saveDat = (relativePath, dat) => {
    const path = getDatPath(relativePath);
    fs.writeFileSync(path, JSON.stringify(dat));
};

const throwError = (message) => {
    throw `
#### ERROR ################################################################
${message}
###########################################################################
`;
};

const showMessage = (message) => {
    console.log('==== Local Movie Player ===================================================');
    console.log(message);
    console.log('===========================================================================');
};

const parseArgv = () => {
    if (process.argv.length <= 2) {
        return {};
    }
    const result = {};
    process.argv.forEach((arg, i) => {
        if (i < 2) {
            return true;
        }
        if (arg.startsWith('--')) {
            const [name, value] = arg.substr(2).split('=');
            result[name] = value;
        }
    });
    return result;
};

let args;
const getArgs = () => {
    if (!args) {
        args = parseArgv();
    }
    return args;
}

export {
    initContext,
    context,
    getAbsolutePath,
    hasDat,
    loadDat,
    saveDat,
    showMessage,
    getArgs
}