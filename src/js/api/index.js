const express = require('express');
const { init } = require('./init');

const PORT = 3000;

const run = () => {
    const api = express();
    api.get('/init', init);
    api.listen(PORT, () => {
        console.log(`API Server running on http://localhost:${PORT}`);
    });
};

module.exports = {
    run
};
