"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.unflag = exports.toFlag = exports.simpleFormatter = exports.changeCase = exports.toArray = exports.stylizer = exports.filterOptions = exports.toConfig = exports.toCommands = exports.toYargsOptions = exports.parseCommand = exports.escapeRegex = void 0;
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const init_1 = require("./init");
const TEMPLATE_EXP = /\{.+?\}/g;
const helpers = {
    upper: v => changeCase(v, 'upper'),
    lower: v => changeCase(v, 'lower'),
    cap: v => changeCase(v, 'cap'),
    dash: v => changeCase(v, 'dash'),
    snake: v => changeCase(v, 'snake'),
    title: v => changeCase(v, 'title'),
    dot: v => changeCase(v, 'dot'),
    camel: v => changeCase(v, 'camel'),
};
/**
 * Escapes a regexp string.
 *
 * @param str the string to escape.
 */
function escapeRegex(str) {
    return str
        .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
        .replace(/-/g, '\\x2d');
}
exports.escapeRegex = escapeRegex;
/**
 * Parses a command looking up wildcards when present.
 *
 * @param arg the complete unparsed argument/command.
 */
function parseCommand(arg) {
    const args = arg.trim().match(/('.*?'|".*?"|\S+)/g);
    const command = args.shift();
    const isNpm = command === 'npm';
    // If npm remove "run"
    if (isNpm)
        args.shift();
    const scriptCmd = args[0];
    const wildIndex = (scriptCmd || '').indexOf('*');
    if (!scriptCmd || !~wildIndex) {
        return [{
                command,
                args
            }];
    }
    const keys = Object.keys(init_1.appPkg.scripts || {});
    if (!keys.length)
        throw createError(`Received script command ${scriptCmd} but no scripts present in package.json.`);
    const beforeIndex = escapeRegex(scriptCmd.substr(0, wildIndex));
    const afterIndex = escapeRegex(scriptCmd.substr(wildIndex + 1));
    const wildExp = new RegExp(`^${beforeIndex}(.*?)${afterIndex}$`);
    const filtered = keys.filter(v => wildExp.test(v));
    return filtered.map(s => {
        const _args = [s, ...args.slice(1)];
        if (isNpm)
            _args.unshift('run');
        return {
            command,
            args: _args
        };
    });
}
exports.parseCommand = parseCommand;
/**
 * Converts help config objects to Yargs Parser config objects.
 *
 * @param helpItems the configuration object to be converted.
 */
function toYargsOptions(items, configuration = {}) {
    const boolean = [];
    const number = [];
    const array = [];
    const string = [];
    const defaults = {};
    const alias = {};
    const coerce = {};
    let aliases = [];
    for (const k in items) {
        const conf = items[k];
        const isArray = conf.type.startsWith('[');
        const type = isArray ? conf.type.replace(/(\[|\])/g, '') : conf.type;
        if (isArray)
            array.push({ key: k, [type]: true });
        else if (type === 'number')
            number.push(k);
        else if (type === 'boolean')
            boolean.push(k);
        else
            string.push(k);
        if (conf.default)
            defaults[k] = conf.default;
        if (conf.alias) {
            const arr = toArray(conf.alias);
            aliases = [...aliases, ...arr];
            alias[k] = arr;
        }
        if (conf.coerce)
            coerce[k] = conf.coerce;
    }
    const options = {
        string,
        boolean,
        number,
        array,
        default: defaults,
        alias,
        coerce,
        configuration
    };
    return {
        options,
        aliases
    };
}
exports.toYargsOptions = toYargsOptions;
/**
 * Sorts arrays and parses into keyed object.
 *
 * @param options the parsed options object.
 */
function argsToObj(options) {
    const obj = {};
    for (const k in options) {
        options[k] = options[k] || [];
        const args = options[k].sort((a, b) => {
            if (a[0] < b[0])
                return -1;
            else if (a[0] > b[0])
                return 1;
            else
                return 0;
        });
        obj[k] = args.reduce((a, c) => {
            const index = c.shift();
            a[index] = c;
            return a;
        }, {});
    }
    return obj;
}
/**
 * Builds commands into configuration for Spawnmon.
 *
 * @param commands takes string commands to parse.
 * @param as optional as or labels to run commands "as".
 */
function toCommands(commands, options) {
    const normalized = argsToObj(options);
    let ctr = 0;
    let _commands = [...commands].reduce((a, c, groupIndex) => {
        let parsed = parseCommand(c);
        const isGroup = parsed.length > 1;
        const groupIndexLast = ctr + parsed.length - 1;
        parsed = parsed.map(({ command, args }, index) => {
            const opts = {
                command,
                args,
                index: ctr,
                groupIndex,
                groupIndexLast,
                isGroup,
                as: command + '-' + ctr,
                runnable: true
            };
            ctr += 1;
            return opts;
        });
        return [...a, ...parsed];
    }, []);
    const getOpts = (key, index) => {
        const typeOpts = normalized[key] || {};
        return (typeOpts[index] || []);
    };
    const getCmd = (index) => {
        if (!_commands[index])
            return undefined;
        return _commands[index];
    };
    _commands = _commands.map((cmd, index) => {
        const [tTarget, interval] = getOpts('onTimeout', index);
        const [pTarget, retries] = getOpts('onConnect', index);
        const [host, port] = getOpts('onConnectAddress', index);
        const timerCmd = getCmd(index);
        const pingerCmd = getCmd(index);
        let timerTargetCmd = getCmd(tTarget);
        let pingerTargetCmd = getCmd(pTarget);
        // Switch the target to the last 
        // command index in the group.
        if (timerTargetCmd?.isGroup)
            timerTargetCmd = getCmd(timerTargetCmd.groupIndexLast);
        // Switch the target to the last 
        // command index in the group.
        if (pingerTargetCmd?.isGroup)
            pingerTargetCmd = getCmd(pingerTargetCmd.groupIndexLast);
        let timer;
        let pinger;
        if (timerCmd && timerTargetCmd) {
            timerTargetCmd.runnable = false;
            timer = {
                name: timerCmd.as,
                target: timerTargetCmd.as,
                interval
            };
        }
        if (pingerCmd && pingerTargetCmd) {
            pingerTargetCmd.runnable = false;
            pinger = {
                name: pingerCmd.as,
                target: pingerTargetCmd.as,
                host,
                port,
                retries
            };
        }
        cmd = {
            ...cmd,
            group: getOpts('group', cmd.groupIndex).shift(),
            color: getOpts('color', cmd.groupIndex).shift(),
            delay: getOpts('delay', cmd.groupIndex).shift(),
            mute: getOpts('mute', cmd.groupIndex).shift(),
            timer,
            pinger
        };
        // Merge with global options from package.json config or file config.
        return cmd;
    });
    return _commands;
}
exports.toCommands = toCommands;
/**
 * Parses commands and destructures options into
 * Spawnmon commands and options.
 *
 * @param parsed the minimist parsed arguments.
 */
function toConfig(parsed) {
    // console.log(parsed);
    // process.exit();
    const { _, color, delay, mute, onTimeout, version, onConnect, onConnectAddress, group, ...options } = parsed;
    // Ensure group key is set for 
    // prefix key.
    if (group) {
        if (options.prefix)
            options.prefix = options.prefix.replace(/{.+}/, '{group}');
        else
            options.prefix = '[{group}]';
        options.p = options.prefix; // not really needed but...
    }
    const extended = {
        group,
        color,
        delay,
        mute,
        onTimeout,
        onConnect,
        onConnectAddress
    };
    const commands = toCommands(_, extended);
    // need to convert pipeInput to command name
    // now that we have the commands present.
    if (typeof options.pipeInput !== 'undefined')
        options.pipeInput = commands[options.pipeInput].as;
    return {
        commands,
        options: options,
    };
}
exports.toConfig = toConfig;
/**
 * Removes unnecessary keys.
 *
 * @param keys the keys to filter/remove.
 * @param options the object to be filtered.
 */
function filterOptions(keys, options) {
    const cleaned = {
        ...options
    };
    // remove shorthand aliases.
    // and other keys not
    // needed by Spawnmon instance.
    keys.forEach(k => {
        delete cleaned[k];
    });
    return cleaned;
}
exports.filterOptions = filterOptions;
/**
 * Colorizes a string.
 *
 * @param str the string to be stylized.
 * @param style a style or dot notation string of styles.
 * @param styles rest param of styles.
 */
function stylizer(str, style, ...styles) {
    if (style.includes('.')) {
        const segments = style.split('.');
        styles = [...segments, ...styles];
    }
    else if (ansi_colors_1.default[style]) {
        styles.unshift(style);
    }
    return styles.reduce((result, style) => {
        if (!ansi_colors_1.default[style])
            return result;
        return ansi_colors_1.default[style](result);
    }, str);
}
exports.stylizer = stylizer;
/**
 * Ensures value is an array.
 *
 * @param value the value to ensure as array.
 * @param def the default value if undefined or null.
 */
function toArray(value, def = []) {
    if (typeof value === 'undefined' || value === null)
        return def;
    if (Array.isArray(value))
        return value;
    return [value];
}
exports.toArray = toArray;
function changeCase(str, casing, preTrim = true) {
    // Normalizer, from here we can make several cases.
    // Not complete just handy enough for here.
    const preflight = s => {
        if (!s)
            return '';
        if (preTrim) // removes leading/trailing chars like . _ -
            s = s.trim().replace(/^[\s-_.]+/, '').replace(/[\s-_.]+$/, '');
        s = s.replace(/[A-Z]/g, ltr => `_${ltr.toLowerCase()}`); // to snake to split.
        return s.toLowerCase().split(/[A-Z_\-.]/g);
    };
    const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    if (casing === 'upper')
        return str.toUpperCase();
    if (casing === 'lower')
        return str.toLowerCase();
    if (casing === 'cap')
        return capitalize(str);
    if (casing === 'snake')
        return preflight(str).join('_');
    if (casing === 'dash')
        return preflight(str).join('-');
    if (casing === 'dot')
        return preflight(str).join('.');
    if (casing === 'camel')
        return preflight(str).map((s, i) => i > 0 ? capitalize(s) : s).join('');
    if (casing === 'title')
        return preflight(str).map(s => capitalize(s)).join('');
    return str;
}
exports.changeCase = changeCase;
function simpleFormatter(str, obj, exp = TEMPLATE_EXP) {
    let isSingle = false;
    if (!Array.isArray(str) && typeof str !== 'undefined') {
        str = [str];
        isSingle = true;
    }
    const lines = str.map(line => {
        return line.replace(exp, (s) => {
            const clean = s.replace(/({|})/g, '');
            const [key, helper] = clean.split('|');
            const newVal = typeof obj[key] === 'undefined' ? s : obj[key];
            if (!helper || typeof helpers[helper] === 'undefined')
                return newVal;
            return helpers[helper](newVal);
        });
    });
    if (isSingle)
        return lines.shift();
    return lines;
}
exports.simpleFormatter = simpleFormatter;
function toFlag(...values) {
    values = values.map(v => {
        v = v.replace(/^--?/, '');
        if (v.length > 1)
            return '--' + changeCase(v, 'dash');
        return '-' + changeCase(v, 'dash');
    });
    if (values.length === 1)
        return values.shift();
    return values;
}
exports.toFlag = toFlag;
/**
 * Removes either -- or - from value.
 *
 * @param value the value to unflag
 */
function unflag(value) {
    if (typeof value === 'undefined')
        return;
    return value.replace(/^--?/, '');
}
exports.unflag = unflag;
function createError(errOrMessage) {
    let err = errOrMessage;
    if (typeof errOrMessage === 'string')
        err = new Error(errOrMessage);
    err.message = stylizer(err.message, 'red');
    return err;
}
exports.createError = createError;
//# sourceMappingURL=utils.js.map