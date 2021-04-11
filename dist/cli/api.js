"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initApi = void 0;
const spawnmon_1 = require("../spawnmon");
const fs_1 = require("fs");
const help_1 = __importDefault(require("./help"));
const utils_1 = require("./utils");
const path_1 = require("path");
const PACKAGE = JSON.parse(fs_1.readFileSync(path_1.join(__dirname, '../../package.json')).toString());
const DEFAULT_MAP = {
    app: PACKAGE.name,
    ...PACKAGE
};
const { templates } = help_1.default;
const nl = (c = 1) => c === 0 ? '' : '\n'.repeat(c);
function initApi(parsed) {
    const config = utils_1.toConfig(parsed);
    const spawnmon = new spawnmon_1.Spawnmon({ ...config.options });
    const flags = Object.keys(config.options);
    const commands = Object.keys(config.commands);
    // Private Methods
    const toArrayProp = (prop, def = []) => {
        if (typeof prop === 'undefined')
            return def;
        if (!Array.isArray(prop))
            prop = [prop];
        return prop;
    };
    const formatItemProps = (conf) => {
        const { description, help, examples } = conf;
        const map = { ...DEFAULT_MAP, ...conf };
        return {
            description: utils_1.simpleFormatter(description, map),
            help: help.map(h => utils_1.simpleFormatter(h, map)),
            examples: examples.map(e => utils_1.simpleFormatter(e, map)),
        };
    };
    const buildHelpItem = (key) => {
        const conf = help_1.default[key];
        const cols = [];
        conf.alias = toArrayProp(conf.alias);
        conf.examples = toArrayProp(conf.examples);
        conf.help = toArrayProp(conf.help);
        const alias = conf.alias.map(v => utils_1.toFlag(v));
    };
    // Public Methods
    const hasFlag = (...flag) => {
        return flags.some(v => flag.includes(v));
    };
    const hasCommand = (...command) => {
        return commands.some(v => command.includes(v));
    };
    const getHeader = (usage = true) => {
        const lines = [];
        lines.push(templates.logo);
        lines.push('');
        if (usage)
            lines.push(templates.usage);
        lines.push('');
        return lines;
    };
    const getSection = (label, color, indent = '') => {
        label = indent + label;
        if (color)
            utils_1.stylizer(label, color);
        return [
            indent + label + ':',
            ''
        ];
    };
    const run = () => {
        config.commands.forEach(opts => {
            spawnmon.add(opts);
        });
    };
    const showHelp = (key) => {
        let lines = [];
        // If no help key then 
        if (!key) {
            lines = [...getHeader()];
            lines = [...getSection('Commands', 'blueBright')];
        }
    };
    return {
        config,
        hasCommand,
        hasFlag,
        run,
        showHelp
    };
}
exports.initApi = initApi;
//# sourceMappingURL=api.js.map