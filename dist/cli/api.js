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
const { name, ...pkg } = JSON.parse(fs_1.readFileSync(path_1.join(__dirname, '../../package.json')).toString());
const DEFAULT_MAP = {
    app: name,
    ...pkg
};
const { templates } = help_1.default;
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
        const map = { ...DEFAULT_MAP, ...conf };
        return {
            name: utils_1.toFlag(utils_1.changeCase(conf.name, 'dash')),
            alias: toArrayProp(conf.alias).map(v => utils_1.toFlag(v)).join(', '),
            description: utils_1.simpleFormatter(conf.description, map),
            type: conf.type,
            help: toArrayProp(conf.help).map(h => utils_1.simpleFormatter(h, map)).join('\n'),
            examples: toArrayProp(conf.examples).map(e => utils_1.simpleFormatter(e, map)).join('\n'),
            group: conf.group,
            isFlag: conf.isFlag
        };
    };
    const buildHelpItem = (key) => {
        const conf = help_1.default[key];
        const { name, alias, description, type, help, examples, group } = formatItemProps(conf);
        const row = [name, alias, description, type];
        return {
            row,
            help,
            examples,
            group
        };
    };
    const buildHelpItems = () => {
        const groups = Object.keys(help_1.default).reduce((result, key) => {
            const conf = buildHelpItem(key);
            result[conf.group] = result[conf.group] || [];
            result[conf.group] = [...result[conf.group], conf.row];
            return result;
        }, {});
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
        lines.push(' ' + templates.logo); // need space for logo alignment.
        lines.push('');
        if (usage)
            lines.push(templates.usage);
        lines.push('');
        return lines;
    };
    const getSectionHeader = (label, color, indent = '') => {
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
            lines = [...lines, ...getSectionHeader('Commands', 'blueBright')];
            console.log(lines.join('\n'));
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