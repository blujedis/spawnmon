"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.unflag = exports.toFlag = exports.simpleFormatter = exports.changeCase = exports.toArray = exports.stylizer = exports.toConfig = exports.toCommands = exports.toNormalized = exports.filterOptions = exports.argToArray = exports.toMinimistOptions = void 0;
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const SPLIT_ARGS_EXP = /('.*?'|".*?"|\S+)/g;
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
 * Gets preparred items for minimist.
 *
 * @param helpItems help configuration items.
 */
function toMinimistOptions(helpItems) {
    // save shorthand aliases so we can 
    // strip them later of options object.
    let aliases = [];
    const options = Object.keys(helpItems).reduce((confs, key) => {
        const conf = helpItems[key];
        let type = conf.type;
        const isArray = type.startsWith('[');
        type = type.replace(/(\[|\])/g, '');
        type = isArray ? type + '-array' : type;
        const alias = toArray(conf.alias);
        aliases = [...aliases, ...alias];
        confs[key] = {
            type,
            alias: conf.alias
        };
        if (typeof conf.default !== 'undefined')
            confs[key].default = conf.default;
        return confs;
    }, {});
    return {
        aliases,
        options
    };
}
exports.toMinimistOptions = toMinimistOptions;
/**
 * Ensure a parsed argument is properly converted to an array
 * from string removing {} chars.
 *
 * @param args args that should be an array.
 */
function argToArray(args, type = 'string', delimiter = ',') {
    // Not a fan of doing all this, change to different parser
    // minimist is mini-miss a lot of things here, too much clean up!
    if (typeof args === 'string') {
        args = args.replace(/({|})/g, '');
        args = args.split(',').map(v => v.trim());
    }
    let _args = toArray(args);
    if (type === 'boolean' || type === 'number') {
        if (type === 'boolean') {
            _args = _args.map(v => {
                if (/^(true|1)$/.test(v))
                    return v === true || v === 'true' || v === '1' ? true : false;
                return false;
            });
        }
        else {
            _args = _args.map(v => {
                v = parseFloat(v);
                if (isNaN(v))
                    return undefined;
                return v;
            });
        }
    }
    return _args;
}
exports.argToArray = argToArray;
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
    // TODO: need to do some extra work in here
    // for parsed types etc, too much work to use
    // minimist will switch to more adv parser soon.
    // in this use case no need for '--' as all args props
    // not part of a command can only be consumed by Spawnmon.
    delete parsed['--'];
    for (const k in parsed) {
        if (k.includes('-')) {
            parsed[changeCase(k, 'camel')] = parsed[k];
            delete parsed[k];
        }
    }
    return parsed;
}
exports.toNormalized = toNormalized;
/**
 * Builds commands into configuration for Spawnmon.
 *
 * @param commands takes string commands to parse.
 * @param as optional as or labels to run commands "as".
 */
function toCommands(commands, options) {
    const { as, colors, delay, mute } = options;
    // iterate and build the commnds.
    return commands.map((v, index) => {
        const args = v.split(SPLIT_ARGS_EXP).filter(v => {
            return v.length && v !== ' ';
        });
        const command = args.shift();
        return {
            command,
            args,
            index,
            as: (as && as[index]) || command,
            color: colors[index],
            delay: delay[index],
            mute: mute[index]
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
    const { _, as, labels, colors, delay, mute, onIdle, ...options } = normalized;
    const extended = {
        as: argToArray(as || labels),
        colors: argToArray(colors),
        delay: argToArray(delay, 'number'),
        mute: argToArray(mute, 'boolean'),
        onIdle: argToArray(onIdle, 'string')
    };
    const commands = toCommands(_, extended);
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