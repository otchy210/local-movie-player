const { loadDir } = require('./api/init');

const movieDir = '/Users/otchy/Desktop/tmp';
const results = [];
loadDir(movieDir, movieDir, results, console.log, console.log, console.error);
// console.log(results);
