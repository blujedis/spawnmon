"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalOptions = exports.logo = exports.appPkg = exports.pkg = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const DEFFAULT_SPAWNMON_PATH = path_1.join(process.cwd(), 'spawnmon.json');
const logo = fs_1.readFileSync(path_1.join(__dirname, './logo.txt')).toString().trim();
exports.logo = logo;
const pkg = JSON.parse(fs_1.readFileSync(path_1.join(__dirname, '../../../package.json')).toString());
exports.pkg = pkg;
const appPkg = JSON.parse(fs_1.readFileSync(path_1.join(process.cwd(), 'package.json')).toString());
exports.appPkg = appPkg;
const { spawnmon } = appPkg;
let globalOptions = {};
exports.globalOptions = globalOptions;
// Allow loading config, global options from
// package.json key or path to spawnmon.
// path defined in package.json
if (typeof spawnmon === 'string')
    exports.globalOptions = globalOptions = JSON.parse(fs_1.readFileSync(path_1.resolve(spawnmon)).toString());
// spawnmon key is the config object.
else if (typeof spawnmon === 'object' && !Array.isArray(spawnmon))
    exports.globalOptions = globalOptions = spawnmon;
// spawnmon.json exists in project root.
else if (typeof spawnmon === 'undefined' && fs_1.existsSync(DEFFAULT_SPAWNMON_PATH))
    exports.globalOptions = globalOptions = JSON.parse(fs_1.readFileSync(DEFFAULT_SPAWNMON_PATH).toString());
const allowedKeys = ['prefix', 'prefixMax', 'prefixAlign', 'prefixFill', 'defaultColor', 'condensed', 'handleSignals', 'raw', 'maxProcesses', 'outputExitCode', 'sendEnter'];
for (const k in globalOptions) {
    if (!allowedKeys.includes(k))
        delete globalOptions[k];
}
//# sourceMappingURL=init.js.map