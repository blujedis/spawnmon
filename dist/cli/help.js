"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const fs_1 = require("fs");
const path_1 = require("path");
const logo = fs_1.readFileSync(path_1.join(__dirname, './logo.txt')).toString().trim();
// Simple helper to coerce arrays to the correct type.
const coerceToArray = (delim = ',', transform) => (arr) => {
    return arr.reduce((a, c) => {
        c = typeof c === 'string'
            ? c.split(delim).map(v => v.trim())
            : c;
        c = !Array.isArray(c) ? [c] : c;
        a = [...a, c];
        if (!transform)
            return a;
        return transform(a);
    }, []);
};
//////////////////////////////////////////////////
// MISC 
//////////////////////////////////////////////////
const usage = `usage: {app} [options] <commands...>`;
const version = {
    name: `version`,
    description: `Spawnmon version.`,
    alias: 'v',
    examples: [
        `{app} -v`
    ],
    isFlag: true,
    help: `Display the current version for {app}.`,
    type: 'boolean',
    group: 'misc'
};
//////////////////////////////////////////////////
// PREFIX 
//////////////////////////////////////////////////
const prefix = {
    name: `prefix`,
    description: `The prefix template in quotes.`,
    alias: `p`,
    examples: [
        `{app} --prefix "[{pid}]" 'rollup -c -w'`,
        `{app} -p "[{timestamp}]" 'rollup -c -w'`
    ],
    isFlag: true,
    help: [
        `Prefix template can contain any of the following three key words:`,
        `index, command, pid, timestamp`
    ],
    type: 'string',
    group: 'prefix',
    default: '[{index}]'
};
const prefixFill = {
    name: `prefixFill`,
    description: `Prefix alignment fill char`,
    alias: `f`,
    examples: [
        `{app} --prefix-fill ' ' 'rollup -c -w'`,
        `{app} -f '.' 'rollup -c -w'`
    ],
    isFlag: true,
    help: [
        `Specify any single character to be used as "fill" when aligning prefixes.`
    ],
    type: 'string',
    group: 'prefix',
    default: '.'
};
const prefixMax = {
    name: `prefixMax`,
    description: `The maximum prefix length.`,
    alias: `m`,
    examples: [
        `{app} --prefix-max 8 'rollup -c -w'`,
        `{app} -m 8 'rollup -c -w'`
    ],
    isFlag: true,
    help: `When {name} is enabled the prefix including templating cannot exceed this this length. This ensures a cleaner looking terminal.`,
    type: 'number',
    group: 'prefix',
    default: 10
};
const prefixAlign = {
    name: `prefixAlign`,
    description: `Prefix alignment left, right or center.`,
    alias: `a`,
    examples: [
        `{app} --prefix-align right 'rollup -c -w'`,
        `{app} -a right 'rollup -c -w'`
    ],
    isFlag: true,
    help: [
        `Alignment is handy when using command names as prefixes. Consider the following commands:`,
        `\nrollup, react-scripts`,
        `\nThe template [{command}] with alignment 'center' would look like`,
        `\n${utils_1.stylizer('[...rollup...]', 'dim')}\n4{stylizer('[react-scripts]', 'dim')}`,
        `Use --prefix-fill to define the fill char "." or maybe a space " " when using alignment.`
    ],
    type: 'string',
    group: 'prefix'
};
const labels = {
    name: `labels`,
    description: `User defined labels for commands.`,
    alias: [`l`, 'as'],
    examples: [
        `{app} --labels rup,cra 'rollup -c -w' 'react-scripts start'`,
        `{app} -l rup,cra 'rollup -c -w' 'react-scripts start'`,
        `{app} --labels=rup,cra 'rollup -c -w' 'react-scripts start'`
    ],
    isFlag: true,
    help: `Display the current version for {app}.`,
    type: '[string]',
    group: 'prefix',
    coerce: coerceToArray()
};
const colors = {
    name: `colors`,
    description: `Specify prefix color by name or index.`,
    alias: 'c',
    examples: [
        `{app} --colors yellow,cyan 'rollup -c -w' 'react-scripts start'`,
        `{app} -c yellow,cyan 'rollup -c -w' 'react-scripts start'`,
        `{app} --colors=yellow,cyan 'rollup -c -w' 'react-scripts start'`
    ],
    isFlag: true,
    help: `Display the current version for {app}.`,
    type: '[string]',
    group: 'prefix',
    coerce: coerceToArray()
};
//////////////////////////////////////////////////////////
// STYLING
///////////////////////////////////////////////////////////
const defaultColor = {
    name: `defaultColor`,
    description: `The default color for line prefixes.`,
    alias: `t`,
    examples: [
        `{app} --default-color dim 'rollup -c -w'`,
        `{app} -t bgRed.yellow 'rollup -c -w'`
    ],
    isFlag: true,
    help: [
        `The default color applies to all prefixes use '--colors' to apply custom colors to each command.`
    ],
    type: 'string',
    group: 'styling',
    default: 'dim'
};
const condensed = {
    name: `condensed`,
    description: `Skips blank lines for compact lines.`,
    alias: `n`,
    examples: [
        `{app} --condensed 'rollup -c -w'`,
        `{app} -n 'rollup -c -w'`
    ],
    isFlag: true,
    help: `Depending on the module run some output multiple newlines which can make the terminal unnecessarily length. Condensed limits this as much as reasonable.`,
    type: 'boolean',
    group: 'styling',
    default: false
};
//////////////////////////////////////////////////
// PROCESS 
//////////////////////////////////////////////////
const delay = {
    name: `raw`,
    description: `Delays the start of the command.`,
    alias: `d`,
    examples: [
        `{app} --delay 500 'rollup -c -w'`,
        `{app} -d 0 1200 'rollup -c -w' 'react-scripts start'`
    ],
    isFlag: true,
    help: `When using {app} you can delay the start of individual scripts. There are various reasons why you might want to do this. One might be to make logs easier to read since spawn processes fire off at once.`,
    type: '[string]',
    group: 'process',
    coerce: coerceToArray(',', (arr) => {
        return arr.map(v => parseFloat(v));
    })
};
const mute = {
    name: `raw`,
    description: `Mutes the output of a given spawned process.`,
    alias: `u`,
    examples: [
        `{app} --mute rollup 'rollup -c -w'`,
        `{app} -u=rollup,react-scripts 'rollup -c -w' 'react-scripts start'`,
        `{app} -u=rollup -u=react-scripts 'rollup -c -w' 'react-scripts start'`,
    ],
    isFlag: true,
    help: `Specifying mute for a command/process will silence the output of that command's output.`,
    type: '[string]',
    group: 'process',
    coerce: coerceToArray(',')
};
const raw = {
    name: `raw`,
    description: `Directly log lines to write/output stream.`,
    alias: `r`,
    examples: [
        `{app} --raw 'rollup -c -w'`,
        `{app} -r 'rollup -c -w'`
    ],
    isFlag: true,
    help: `When using {app} programatically "transform" method is still called before writing.`,
    type: 'boolean',
    group: 'process',
    default: false
};
const onTimer = {
    name: `onTimer`,
    description: `Maps process to run on timer idle for process.`,
    alias: `o`,
    examples: [
        `{app} --on-timer rollup:echo 'rollup -c -w' 'echo "rollup idle"'`,
        `{app} -o rollup:echo 'rollup -c -w' 'echo "rollup idle"'`,
        `{app} -o rollup:echo:2500 'rollup -c -w' 'echo "rollup idle"'`
    ],
    isFlag: true,
    help: `On timer waits for a steam to become stale, essentially stops outputting to terminal, then runs the specified command. Accepts source command, target and interval to run timer in form of: source:target:2500`,
    type: '[string]',
    group: 'process',
    coerce: coerceToArray(':', (arr) => {
        arr = arr.map(tuple => {
            if (typeof tuple[2] !== 'undefined')
                tuple[2] = parseInt(tuple[2], 10);
            return {
                name: tuple[0],
                target: tuple[1],
                interval: tuple[2]
            };
        });
        return arr;
    })
};
const onPinger = {
    name: `onPinger`,
    description: `Enables running command after ping successfully connects.`,
    alias: `g`,
    examples: [
        `{app} --on-pinged react-scripts:electron 'react-scripts start' 'electron .'`,
        `{app} -g react-scripts:electron:10 'react-scripts start'`
    ],
    isFlag: true,
    help: `The on pinged flag creates a socket and pings the host/port until aborted or connected. If the socket connects it auto closes and then launches the next command, Accepts source, target, host and port in form of: source:target:127.0.0.1:3000.`,
    type: '[string]',
    group: 'process',
    coerce: coerceToArray(':', (arr) => {
        arr = arr.map(tuple => {
            if (typeof tuple[3] !== 'undefined')
                tuple[3] = parseInt(tuple[3], 10);
            return {
                name: tuple[0],
                target: tuple[1],
                host: tuple[2],
                port: tuple[3]
            };
        });
        return arr;
    })
};
const maxProcesses = {
    name: `maxProcess`,
    description: `Specify the max number of processes.`,
    alias: `x`,
    examples: [
        `{app} --max-processes 5 'rollup -c -w'`,
        `{app} -x 5 'rollup -c -w'`
    ],
    isFlag: true,
    help: `Defines the maximum number of children that may be spawned. When using programatically this also applies to command dependents that are spawned.`,
    type: 'number',
    group: 'process',
    default: 5
};
const configs = {
    templates: {
        logo,
        usage
    },
    raw,
    maxProcesses,
    prefixAlign,
    defaultColor,
    condensed,
    prefix,
    prefixFill,
    prefixMax,
    labels,
    version,
    colors,
    delay,
    mute,
    onTimer,
    onPinger,
};
exports.default = configs;
//# sourceMappingURL=help.js.map