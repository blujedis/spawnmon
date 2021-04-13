"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.unflag = exports.toFlag = exports.simpleFormatter = exports.changeCase = exports.toArray = exports.stylizer = exports.filterOptions = exports.toConfig = exports.toCommands = exports.toYargsOptions = void 0;
const yargs_parser_1 = __importDefault(require("yargs-parser"));
const ansi_colors_1 = __importDefault(require("ansi-colors"));
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
 * Converts help config objects to Yargs Parser config objects.
 *
 * @param helpItems the configuration object to be converted.
 */
function toYargsOptions(helpItems, configuration = {}) {
    const { templates, ...clean } = helpItems;
    const boolean = [];
    const number = [];
    const array = [];
    const string = [];
    const defaults = {};
    const alias = {};
    const coerce = {};
    let aliases = [];
    for (const k in clean) {
        const conf = clean[k];
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
 * Builds commands into configuration for Spawnmon.
 *
 * @param commands takes string commands to parse.
 * @param as optional as or labels to run commands "as".
 */
function toCommands(commands, options) {
    const { as, colors, delay, mute, onTimer, onPinger } = options;
    // Store array of child commands meaning
    // they depend on a command that calls them
    // after ping or timer expires.
    const children = [];
    const getIndexed = (cmd, arr = []) => arr.filter(c => {
        return c.name === cmd;
    })[0] || [];
    const _commands = commands.map((v, index) => {
        const args = yargs_parser_1.default(v)._;
        const command = args.shift();
        const _mute = typeof toArray(mute)[index] === 'string' ? true : false;
        const timer = getIndexed(command, onTimer);
        const pinger = getIndexed(command, onPinger);
        const name = ((as && as[index]) || command);
        if (timer.target)
            children.unshift(timer.target);
        if (pinger.target)
            children.unshift(pinger.target);
        return {
            command,
            args,
            as: name,
            color: toArray(colors)[index],
            delay: toArray(delay)[index],
            mute: _mute,
            timer,
            pinger
        };
    });
    return {
        commands: _commands,
        children: children
    };
}
exports.toCommands = toCommands;
/**
 * Parses commands and destructures options into
 * Spawnmon commands and options.
 *
 * @param parsed the minimist parsed arguments.
 */
function toConfig(parsed) {
    const { _, as, labels, colors, delay, mute, onTimer, version, onPinger, ...options } = parsed;
    const extended = {
        as: as || labels,
        colors,
        delay,
        mute,
        onTimer,
        onPinger
    };
    const { commands, children } = toCommands(_, extended);
    return {
        commands,
        children,
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