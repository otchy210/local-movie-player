const { loadDir } = require('./api/init');

const results = [];
loadDir(true, '/Volumes/home/tmp/premium-videos', results, console.log, console.log, console.error);
