"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const fs_1 = require("fs");
const path_1 = require("path");
const logo = fs_1.readFileSync(path_1.join(__dirname, './logo.txt')).toString().trim();
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
    alias: [`l`],
    examples: [
        `{app} --labels {rup,cra} 'rollup -c -w' 'react-scripts start'`,
        `{app} -l {rup,cra} 'rollup -c -w' 'react-scripts start'`,
        `{app} --labels={rup,cra} 'rollup -c -w' 'react-scripts start'`
    ],
    isFlag: true,
    help: `Display the current version for {app}.`,
    type: '[string]',
    group: 'prefix'
};
const colors = {
    name: `colors`,
    description: `Specify prefix color by name or index.`,
    alias: 'c',
    examples: [
        `{app} --colors {yellow,cyan} 'rollup -c -w' 'react-scripts start'`,
        `{app} -c {yellow,cyan} 'rollup -c -w' 'react-scripts start'`,
        `{app} --colors={yellow,cyan} 'rollup -c -w' 'react-scripts start'`
    ],
    isFlag: true,
    help: `Display the current version for {app}.`,
    type: '[string]',
    group: 'prefix'
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
        `{app} --delay {500} 'rollup -c -w'`,
        `{app} -d {0,1200} 'rollup -c -w' 'react-scripts start'`
    ],
    isFlag: true,
    help: `When using {app} you can delay the start of individual scripts. There are various reasons why you might want to do this. One might be to make logs easier to read since spawn processes fire off at once.`,
    type: '[number]',
    group: 'process'
};
const mute = {
    name: `raw`,
    description: `Mutes the output of a given spawned process.`,
    alias: `d`,
    examples: [
        `{app} --mute {true} 'rollup -c -w'`,
        `{app} -u {0,true} 'rollup -c -w' 'react-scripts start'`
    ],
    isFlag: true,
    help: `Specifying mute for a command/process will silence the output of that command's output.`,
    type: '[boolean]',
    group: 'process'
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
const onIdle = {
    name: `onIdle`,
    description: `Maps process to run on idle of previous process.`,
    alias: `o`,
    examples: [
        `{app} --on-idle {rollup:echo} 'rollup -c -w' 'echo on rollup idle'`,
        `{app} -o {rollup:echo} 'rollup -c -w' 'echo on rollup idle'`,
        `{app} -o {rollup:echo:2500} 'rollup -c -w' 'echo on rollup idle'`
    ],
    isFlag: true,
    help: `On idle simply looks for stale output streams of the spawned command. Each output to the terminal updates the timer. If the interval is exceeded and the update counter is the same as the previous, the on condition event is emitted calling listeners. Not perfect but works well out of the box with default settings.`,
    type: '[string]',
    group: 'process'
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
    onIdle
};
exports.default = configs;
//# sourceMappingURL=help.js.map