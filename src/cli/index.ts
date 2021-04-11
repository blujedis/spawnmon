import minimist, { ParsedArgs } from 'minimist';
import { Spawnmon } from '../spawnmon';
import { initApi } from './api';

const cli = initApi(minimist(process.argv.slice(2)));

cli.showHelp();

// if (cli.hasFlag('h', 'help'))
//   return cli.showHelp();


