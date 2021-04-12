"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initApi = void 0;
const minimist_1 = __importDefault(require("minimist"));
const minimist_options_1 = __importDefault(require("minimist-options"));
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
const { templates, ...rest } = help_1.default;
// Simple api for managing commands.
function initApi(argv) {
    let firstArg = utils_1.unflag(argv[0] || '');
    firstArg = (firstArg === 'h' || firstArg === 'help' ? '' : firstArg);
    const { aliases, options } = utils_1.toMinimistOptions(rest);
    const parsed = minimist_1.default(argv, minimist_options_1.default(options));
    const config = utils_1.toConfig(parsed);
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
    const padLine = (value, padding) => {
        let rows = [];
        if (!Array.isArray(value))
            value = [value];
        if (padding === 'none')
            return value;
        if (padding === 'both' || padding === 'top')
            rows.push('');
        rows = [...rows, ...value];
        if (padding === 'both' || padding === 'bottom')
            rows.push('');
        return rows;
    };
    const getSectionHeader = (label, color, padding = 'bottom', indent = '') => {
        label = indent + label;
        if (color)
            label = utils_1.stylizer(label, color);
        const rows = padLine(indent + label, padding);
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
    // Spawnmon has no commands so first arg must be
    // either a flag option or start with a " or '
    function isValidFirstArg(arg) {
        return /^--?/.test(arg) || /^("|')/.test(arg);
    }
    // Public Methods
    const show = {
        logo: (padding = 'none') => {
            const lines = padLine(' ' + templates.logo, padding);
            return console.log(lines.join('\n'));
        },
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
            show.section('examples:', 'green');
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
        pad: (count = 1) => console.log('\n'.repeat(count)),
        message: (msg, color, padding = 'both') => {
            if (color)
                msg = utils_1.stylizer(msg, color);
            const lines = padLine(msg, padding);
            console.log(lines.join('\n'));
        },
        help: (key = firstArg) => {
            // If no help key then 
            if (!hasHelpArg(key)) {
                show.header(true, false);
                show.groups('blue');
                console.log();
                return;
            }
            show.logo('none');
            if (key == 'examples')
                show.examples('blue');
            return show.item(key, 'blue');
        }
    };
    const hasFlag = (...flag) => {
        return flags.some(v => flag.includes(utils_1.unflag(v)));
    };
    const hasCommand = (...command) => {
        return commands.some(v => command.includes(v));
    };
    const hasFlags = () => !!Object.keys(flags).length;
    const hasCommands = () => !!commands.length;
    const hasHelp = () => {
        return hasFlag('h', 'help');
    };
    const hasHelpArg = (key = firstArg) => {
        return key && hasFlag(firstArg) && hasHelp();
    };
    const run = () => {
        const cleaned = utils_1.filterOptions([...aliases, 'version'], config.options);
        const spawnmon = new spawnmon_1.Spawnmon(cleaned);
        config.commands.forEach(opts => {
            // console.log(opts);
            const cmd = spawnmon.add(opts);
        });
    };
    return {
        argv,
        config,
        hasFlags,
        hasCommands,
        hasCommand,
        hasFlag,
        hasHelp,
        hasHelpArg,
        firstArg,
        run,
        show
    };
}
exports.initApi = initApi;
exports.default = initApi(process.argv.slice(2));
//# sourceMappingURL=api.js.map