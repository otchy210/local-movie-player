const express = require('express');
const expressWs = require('express-ws');
const { init } = require('./init');
const { API_PORT } = require('../const');

const run = () => {
    const apiApp = express();
    expressWs(apiApp);
    apiApp.ws('/init', init);
    apiApp.listen(API_PORT, () => {
        console.log(`API Server running on http://localhost:${API_PORT}`);
    });
};

module.exports = {
    run
};
