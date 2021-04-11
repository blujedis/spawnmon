"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initApi = void 0;
const spawnmon_1 = require("../spawnmon");
const fs_1 = require("fs");
const table_1 = __importDefault(require("./table"));
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
    const formatItemProps = (conf) => {
        const map = { ...DEFAULT_MAP, ...conf };
        return {
            name: utils_1.toFlag(utils_1.changeCase(conf.name, 'dash')),
            alias: utils_1.toArray(conf.alias).map(v => utils_1.toFlag(v)).join(', '),
            description: utils_1.simpleFormatter(conf.description, map),
            type: conf.type,
            help: utils_1.toArray(conf.help).map(h => utils_1.simpleFormatter(h, map)),
            examples: utils_1.toArray(conf.examples).map(e => utils_1.simpleFormatter(e, map)),
            group: conf.group,
            isFlag: conf.isFlag
        };
    };
    const buildHelpItem = (key) => {
        const conf = help_1.default[key];
        const { name, alias, description, type, help, examples, group } = formatItemProps(conf);
        const row = [name, alias, description, type];
        return {
            name,
            row,
            help,
            examples,
            group
        };
    };
    const buildHelpItems = () => {
        const groups = [];
        const { templates, ...rest } = help_1.default;
        const confs = Object.keys(rest).reduce((result, key) => {
            const conf = buildHelpItem(key);
            if (!groups.includes(conf.group))
                groups.push(conf.group);
            result[conf.group] = result[conf.group] || {};
            result[conf.group][conf.name] = conf;
            // [...result[conf.group], conf.row];
            return result;
        }, {});
        return [groups, confs];
    };
    const getSectionHeader = (label, color, padding = 'bottom', indent = '') => {
        label = indent + label;
        if (color)
            label = utils_1.stylizer(label, color);
        const rows = [
            indent + label,
        ];
        if (padding === 'top' || padding === 'both')
            rows.unshift('');
        if (padding === 'bottom' || padding === 'both')
            rows.push('');
        return rows;
    };
    const getHeader = (usage = true, padding) => {
        const lines = [];
        lines.push(' ' + templates.logo); // need space for logo alignment.
        if (!usage && padding || usage)
            lines.push('');
        if (usage) {
            lines.push(utils_1.stylizer(utils_1.simpleFormatter(templates.usage, DEFAULT_MAP), 'cyan'));
            lines.push('');
            lines.push(utils_1.stylizer(utils_1.simpleFormatter(`detailed help: {app} --some-option -h`, DEFAULT_MAP), 'dim.italic'));
            if (padding)
                lines.push('');
        }
        return lines;
    };
    const show = {
        header: (usage = true, padding) => console.log(getHeader(usage, padding).join('\n')),
        section: (label, color, padding = 'bottom', indent = '') => console.log(getSectionHeader(label, color, padding, indent).join('\n')),
        groups: (color) => {
            const [groups, confs] = buildHelpItems();
            groups.forEach(k => {
                const tree = confs[k];
                show.section(k + ':', color, 'both');
                const rows = [];
                Object.keys(tree).forEach(n => rows.push(tree[n].row));
                const str = table_1.default
                    .init()
                    .rows(...rows)
                    .border('none')
                    .width(18, 10, 45)
                    .align('columns', 'left', 'left', 'left', 'right')
                    .wrapped()
                    .toString();
                console.log(str);
            });
        },
        item: (key, color) => {
            const item = buildHelpItem(key);
            show.section(item.name + `:`, color, 'both');
            show.section(item.help.map(h => '  ' + h).join('\n'), 'dim');
            show.section('examples:', 'yellow');
            show.section(item.examples.map(ex => '  ' + ex).join('\n'));
            console.log();
        },
        examples: (color) => {
            const [groups, confs] = buildHelpItems();
            groups.forEach(k => {
                const tree = confs[k];
                show.section(k + ':', color, 'both');
                let rows = [];
                Object.keys(tree).forEach((n, i) => {
                    const padKey = i === 0 ? 'bottom' : 'both';
                    const itemHdr = getSectionHeader(n, null, padKey);
                    rows.push(...itemHdr);
                    const ex = tree[n].examples.map(line => utils_1.stylizer('  ' + line, 'dim'));
                    rows = [...rows, ...ex];
                });
                console.log(rows.join('\n') + '\n');
            });
        },
        pad: (count = 1) => console.log('\n'.repeat(count))
    };
    // Public Methods
    const hasFlag = (...flag) => {
        return flags.some(v => flag.includes(v));
    };
    const hasCommand = (...command) => {
        return commands.some(v => command.includes(v));
    };
    const run = () => {
        config.commands.forEach(opts => {
            spawnmon.add(opts);
        });
    };
    const showHelp = (key) => {
        // If no help key then 
        if (!key) {
            show.header(true, false);
            show.groups('blue');
            return;
        }
        if (key !== 'examples')
            show.item('prefix', 'blue');
        else
            show.examples('blue');
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