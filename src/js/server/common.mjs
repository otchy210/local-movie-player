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

const loadDat = (relativePath) => {
    const path = getDatPath(relativePath);
    if(!fs.existsSync(path)) {
        return {};
    }
    const stat = fs.statSync(path);
    if (!stat.isFile()) {
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

export {
    initContext,
    context,
    getAbsolutePath,
    loadDat,
    saveDat,
    showMessage
}