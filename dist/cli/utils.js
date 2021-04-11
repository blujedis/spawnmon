"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFlag = exports.simpleFormatter = exports.changeCase = exports.toArray = exports.stylizer = exports.toConfig = exports.toCommands = exports.toNormalized = void 0;
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const SPLIT_ARGS_EXP = /('(\\'|[^'])*'|"(\\"|[^"])*"|\/(\\\/|[^/])*\/|(\\ |[^ ])+|[\w-]+)/g;
const CSV_EXP = /(\w,?)+/;
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
 * Normalizes, bascially some clean up after minimist parses arguments.
 *
 * @param parsed the parsed arguments.
 */
function toNormalized(parsed) {
    // Is comma separated value, split to array.
    if (typeof parsed.as === 'string' && CSV_EXP.test(parsed.as)) {
        parsed.as = parsed.as
            .replace(/[[\]{}]/g, '')
            .split(',')
            .map(v => v.trim());
    }
    // in this use case no need for '--' as all args props
    // not part of a command can only be consumed by Spawnmon.
    delete parsed['--'];
    return parsed;
}
exports.toNormalized = toNormalized;
/**
 * Builds commands into configuration for Spawnmon.
 *
 * @param commands takes string commands to parse.
 * @param as optional as or labels to run commands "as".
 */
function toCommands(commands, as = []) {
    // iterate and build the commnds.
    return commands.map((v, index) => {
        const args = v.split(SPLIT_ARGS_EXP);
        const command = args.shift();
        return {
            command,
            args,
            index,
            as: (as && as[index]) || command
        };
    });
}
exports.toCommands = toCommands;
/**
 * Parses commands and destructures options into
 * Spawnmon commands and options.
 *
 * @param parsed the minimist parsed arguments.
 */
function toConfig(parsed) {
    const normalized = toNormalized(parsed);
    // Destructure out the commands from
    // Spawnmon flag options.
    // NOTE: labels an alias for "as".
    const { _, as, labels, ...options } = normalized;
    const commands = toCommands(_, as || labels);
    return {
        commands,
        options: options
    };
}
exports.toConfig = toConfig;
/**
 * Colorizes a string.
 *
 * @param str the string to be stylized.
 * @param style a style or dot notation string of styles.
 * @param styles rest param of styles.
 */
function stylizer(str, style, ...styles) {
    if (typeof style === 'string') {
        const segments = style.split('.');
        styles = [...segments, ...styles];
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
        return preflight(str).map((s, i) => i > 0 ? capitalize(s) : s);
    if (casing === 'title')
        return preflight(str).map(s => capitalize(s));
    return str;
}
exports.changeCase = changeCase;
function simpleFormatter(str, obj, exp = TEMPLATE_EXP) {
    let isSingle = false;
    if (!Array.isArray(str) && typeof str !== 'undefined') {
        str = [str];
        isSingle = true;
    }
    const lines = str;
    lines.map(line => {
        line.replace(exp, (s) => {
            const clean = s.replace(/({|})/, '');
            const [key, helper] = clean.split('|');
            const newVal = typeof obj[key] !== 'undefined' ? s : obj[key];
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
//# sourceMappingURL=utils.js.map