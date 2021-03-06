"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDefaults = exports.simpleTimestamp = exports.createError = exports.cloneClass = exports.truncate = exports.pad = exports.escapeRegex = exports.isBlankLine = exports.colorize = exports.chomp = exports.NEWLINE_EXP = void 0;
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const strip_ansi_1 = __importDefault(require("strip-ansi"));
exports.NEWLINE_EXP = /\r?\n$/u;
/**
 * Detects line returns if match slices,
 * run before transform to retain consistent
 * line returns.
 *
 * @param line the line to be cleaned up.
 */
function chomp(line) {
    const match = exports.NEWLINE_EXP.exec(line);
    if (!match)
        return line;
    return line.slice(0, match.index);
}
exports.chomp = chomp;
/**
 * Helper to colorize strings with ansi colors.
 *
 * @see https://www.npmjs.com/package/ansi-styles
 *
 * @param str the string to be colorize.
 * @param styles the ansi color styles to be applied.
 */
function colorize(str, ...styles) {
    return styles.reduce((result, color) => {
        if (!ansi_colors_1.default[color])
            return result;
        return ansi_colors_1.default[color](result);
    }, str);
}
exports.colorize = colorize;
/**
 * Checks if line is a blank line after stripping any ansi styles or line returns.
 *
 * @param line the line to be inspected.
 */
function isBlankLine(line) {
    const str = stripAnsi(line);
    return !str.replace(exports.NEWLINE_EXP, '').length;
}
exports.isBlankLine = isBlankLine;
/**
 * Strips line of ansi styles.
 *
 * @see https://www.npmjs.com/package/strip-ansi
 *
 * @param line the line to be stripped.
 */
function stripAnsi(line) {
    return strip_ansi_1.default(line);
}
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
 * Pads a string left or right.
 *
 * @param str the string to be padded.
 * @param dir the direction left or right.
 * @param spaces the amount of padding to apply.
 */
function pad(str, dir, spaces = 0) {
    if (dir === 'left')
        return ' '.repeat(spaces) + str;
    return str + ' '.repeat(spaces);
}
exports.pad = pad;
/**
 * Truncates a string.
 *
 * @param str the string to be inspected or truncated.
 * @param max the maximum length permissible.
 * @param char the trailing char when exceeds length.
 */
function truncate(str, max = 0, char = '...') {
    if (!max || !str)
        return str;
    if (str.length <= max)
        return str;
    return str.substr(0, max - char.length) + char;
}
exports.truncate = truncate;
/**
 * Simple method to clone a class.
 *
 * @param instance the class instance you wish to clone.
 */
function cloneClass(instance) {
    return Object.assign(Object.create(Object.getPrototypeOf(instance)), instance);
}
exports.cloneClass = cloneClass;
/**
 * Just creates a styled error message.
 *
 * @param err the error message or Error instance.
 */
function createError(err) {
    if (!(err instanceof Error))
        err = new Error(err);
    err.message = colorize(err.message, 'red');
    return err;
}
exports.createError = createError;
/**
 * Timestamp only supports long format e.g. 'YYYY.MM.DD HH:mm:ss'
 * If you need more advanced formatting pass in "onTimestamp"
 * handler in Spawnmon options.
 *
 * @param format the format to be used.
 * @param date the date to create timestamp for.
 */
function simpleTimestamp(date = new Date(), timeOnly = true) {
    const segments = date
        .toISOString()
        .split('.')[0] // remove offset too long.
        .split('T'); // split date and time.
    if (!timeOnly)
        return segments[1];
    return segments.join(' ') // join using empty space.
        .replace(/-/g, '.'); // change - to . it's shorter.
}
exports.simpleTimestamp = simpleTimestamp;
/**
 * Ensures an options object contains correct default values.
 *
 * @param options the options object to ensure defaults for.
 * @param defaults the default values.
 */
function ensureDefaults(options, defaults) {
    const run = (o, d) => {
        for (const k in d) {
            if (typeof o[k] === 'undefined')
                o[k] = d[k];
            else if (o[k] !== null && typeof o[k] === 'object' && !Array.isArray(o[k]))
                run(o[k], d[k]);
        }
        return o;
    };
    return run({ ...options }, { ...defaults });
}
exports.ensureDefaults = ensureDefaults;
//# sourceMappingURL=utils.js.map