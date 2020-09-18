import { execSync } from 'child_process';
import fs from 'fs';

const MOVIES_EXT = ['.mp4', '.mov', '.m4v'];
let context;

const init = () => {
    context = buildContext();
    validateContext();
    showMessage(context);
    handleDir('/');
};

const buildContext = () => {
    const result = {
        HTTP_PORT: process.env.HTTP_PORT || 8080
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

const handleDir = (relativePath) => {
    console.log(relativePath);
    const absoluteDirPath = `${context.MOVIE_DIR}${relativePath}`;
    const files = fs.readdirSync(absoluteDirPath);
    for (const file of files) {
        const relativeFilePath = `${relativePath}${file}`;
        if (hasMovieExt(file)) {
            handleMovie(relativeFilePath);
        } else if (isDir(relativeFilePath)) {
            handleDir(`${relativeFilePath}/`);
        }
    }
};

const handleMovie = (relativeFilePath) => {
    console.log(relativeFilePath);
}

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
    const stat = fs.statSync(absolutePath);
    return stat.isDirectory();
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
