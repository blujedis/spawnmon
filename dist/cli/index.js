"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const minimist_1 = __importDefault(require("minimist"));
const api_1 = require("./api");
const cli = api_1.initApi(minimist_1.default(process.argv.slice(2)));
// if (cli.hasFlag('h', 'help'))
//   return cli.showHelp();
//# sourceMappingURL=index.js.map