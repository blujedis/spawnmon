import runner from './runner';

const argv = process.argv.slice(2);
const cmd = argv.shift();

process.on('SIGINT', (signal) => runner.kill());