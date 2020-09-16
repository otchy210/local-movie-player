const init = () => {
    const context = buildGlobalContext();
    console.log(context);
};

const buildGlobalContext = () => {
    if (!process.env.MOVIE_DIR) {
        throw "Not found MOVIE_DIR environment variable";
    }
    return {
        HTTP_PORT: process.env.HTTP_PORT || 8080,
        MOVIE_DIR: process.env.MOVIE_DIR
    };
};

export {
    init
};
