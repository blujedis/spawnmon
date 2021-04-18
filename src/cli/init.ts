import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { ICommandOptions, ISpawnmonOptions } from '../types';

const DEFFAULT_SPAWNMON_PATH = join(process.cwd(), 'spawnmon.json');

const logo = readFileSync(join(__dirname, './logo.txt')).toString().trim();

const pkg =
  JSON.parse(readFileSync(join(__dirname, '../../../package.json')).toString());

const appPkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json')).toString());

const { spawnmon } = appPkg;

let globalOptions = {} as ISpawnmonOptions & ICommandOptions & { commands: any; };

// Allow loading config, global options from
// package.json key or path to spawnmon.

// path defined in package.json
if (typeof spawnmon === 'string')
  globalOptions = JSON.parse(readFileSync(resolve(spawnmon)).toString());

// spawnmon key is the config object.
else if (typeof spawnmon === 'object' && !Array.isArray(spawnmon))
  globalOptions = spawnmon;

// spawnmon.json exists in project root.
else if (typeof spawnmon === 'undefined' && existsSync(DEFFAULT_SPAWNMON_PATH))
  globalOptions = JSON.parse(readFileSync(DEFFAULT_SPAWNMON_PATH).toString());

const allowedKeys = ['prefix', 'prefixMax', 'prefixAlign', 'prefixFill', 'defaultColor', 'condensed', 'handleSignals', 'raw', 'maxProcesses', 'outputExitCode', 'sendEnter'];

for (const k in globalOptions) {
  if (!allowedKeys.includes(k))
    delete globalOptions[k];
}

export { pkg, appPkg, logo, globalOptions };