"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.truncate = exports.pad = exports.escapeRegex = exports.isBlankLine = exports.colorize = exports.createTimer = exports.chomp = exports.NEWLINE_EXP = void 0;
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
 * Simple timer monitor that watches update counts. Once
 * the counter goes stale and remains the same between
 * ticks of the "interval" we know then the stream is likely idle.
 *
 *
 * @param options define interval, done callback and callback to check if should exit.
 */
function createTimer(options) {
    options = {
        name: 'anonymous',
        interval: 2500,
        timeout: 15000,
        done: () => { },
        onMessage: console.log,
        ...options
    };
    // Timeout has to be longer, maybe change
    // or make more confirable fine for now.
    if (options.timeout <= options.interval)
        options.timeout = options.interval + 1000;
    const { name, interval, until, done, timeout, onMessage } = options;
    let ctr = 0;
    let prevCtr = 0;
    let intervalId;
    let timeoutId;
    let running = false;
    let initialized = false;
    const api = {
        get running() {
            return running;
        },
        update,
        start,
        stop
    };
    // Default take until condition that based on timeout
    // looks for idle output.
    function takeUntil(previous, current) {
        if (until)
            return until(previous, current, intervalId);
        return initialized && current === previous;
    }
    function update() {
        initialized = true;
        ctr += 1;
    }
    function finished() {
        stop();
        done();
    }
    function initTimeout() {
        timeoutId = setTimeout(() => {
            stop();
            onMessage(`${name} timer expired before meeting condition.`);
        }, timeout);
    }
    function start() {
        if (running)
            return; // already running stop first.
        if (intervalId)
            clearInterval(intervalId);
        running = true;
        initTimeout();
        intervalId = setInterval(function () {
            if (takeUntil(prevCtr, ctr))
                return finished();
            prevCtr = ctr;
        }, interval);
    }
    function stop() {
        clearInterval(intervalId);
        clearInterval(timeoutId);
        ctr = 0;
        prevCtr = 0;
        running = false;
        initialized = false;
    }
    return api;
}
exports.createTimer = createTimer;
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
//# sourceMappingURL=utils.js.map