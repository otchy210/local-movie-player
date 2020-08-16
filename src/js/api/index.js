const express = require('express');
const expressWs = require('express-ws');
const { init } = require('./init');

const PORT = 3000;

const run = () => {
    const api = express();
    expressWs(api);
    api.ws('/init', init);
    api.listen(PORT, () => {
        console.log(`API Server running on http://localhost:${PORT}`);
    });
};

module.exports = {
    run
};
