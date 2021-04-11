"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const fs_1 = require("fs");
const path_1 = require("path");
const logo = fs_1.readFileSync(path_1.join(__dirname, './logo.txt')).toString().trim();
//////////////////////////////////////////////////
// MISC 
//////////////////////////////////////////////////
const usage = `{app} [options] <commands...>`;
const version = {
    name: `version`,
    description: `Spawnmon version.`,
    alias: 'v',
    examples: [
        `{app} -v`
    ],
    isFlag: true,
    help: `Display the current version for {app}.`
};
//////////////////////////////////////////////////
// PREFIX 
//////////////////////////////////////////////////
const prefix = {
    name: `prefix`,
    description: `The prefix template.`,
    alias: `p`,
    examples: [
        `{app} -prefix [{pid}] 'rollup -c -w'`,
        `{app} -p [{timestamp}] 'rollup -c -w'`
    ],
    isFlag: true,
    help: [
        `Prefix template can contain any of the following three key words:`,
        `\nindex, command, pid, timestamp`
    ]
};
const prefixFill = {
    name: `prefix-fill`,
    description: `Prefix alignment fill char`,
    alias: `f`,
    examples: [
        `{app} -prefix-fill ' ' 'rollup -c -w'`,
        `{app} -f '.' 'rollup -c -w'`
    ],
    isFlag: true,
    help: [
        `Specify any single character to be used as "fill" when aligning prefixes.`
    ]
};
const prefixMax = {
    name: `prefix-max`,
    description: `The maximum prefix length.`,
    alias: `m`,
    examples: [
        `{app} -prefix-max 8 'rollup -c -w'`,
        `{app} -m 8 'rollup -c -w'`
    ],
    isFlag: true,
    help: `When {name} is enabled the prefix including templating cannot exceed this this length. This ensures a cleaner looking terminal.`
};
const prefixAlign = {
    name: `prefix-align`,
    description: `Prefix alignment left, right or center.`,
    alias: `a`,
    examples: [
        `{app} --prefix-alignment right 'rollup -c -w'`,
        `{app} -a right 'rollup -c -w'`
    ],
    isFlag: true,
    help: [
        `Alignment is handy when using command names as prefixes. Consider the following commands:`,
        `\nrollup, react-scripts`,
        `\nThe template [{command}] with alignment 'center' would look like`,
        `\n${utils_1.stylizer('[...rollup...]', 'dim')}\n4{stylizer('[react-scripts]', 'dim')}`,
        `Use --prefix-fill to define the fill char "." or maybe a space " " when using alignment.`
    ]
};
const labels = {
    name: `labels`,
    description: `User defined labels for commands.`,
    alias: [`l`, `as`],
    examples: [
        `{app} -labels [rup, cra] 'rollup -c -w' 'react-scripts start'`,
        `{app} -l [rup, cra] 'rollup -c -w' 'react-scripts start'`,
        `{app} -labels=[rup, cra] 'rollup -c -w' 'react-scripts start'`,
        `{app} -l=[rup, cra] 'rollup -c -w' 'react-scripts start'`
    ],
    isFlag: true,
    help: `Display the current version for {app}.`
};
const colors = {
    name: `colors`,
    description: `Specify prefix color by name or index.`,
    alias: 'c',
    examples: [
        `{app} -colors [yellow, cyan] 'rollup -c -w' 'react-scripts start'`,
        `{app} -c [bgBlue.white, blue] 'rollup -c -w' 'react-scripts start'`,
        `{app} -colors=[yellow, green] 'rollup -c -w' 'react-scripts start'`,
        `{app} -c=[bgBlue.white.bold, cyan] 'rollup -c -w' 'react-scripts start'`
    ],
    isFlag: true,
    help: `Display the current version for {app}.`
};
//////////////////////////////////////////////////////////
// STYLING
///////////////////////////////////////////////////////////
const defaultColor = {
    name: `default-color`,
    description: `The default color for line prefixes.`,
    alias: `d`,
    examples: [
        `{app} --default-color dim 'rollup -c -w'`,
        `{app} -d bgRed.yellow 'rollup -c -w'`
    ],
    isFlag: true,
    help: [
        `The default color applies to all prefixes use '--colors' to apply custom colors to each command.`
    ]
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
    help: ``
};
//////////////////////////////////////////////////
// STREAMS & PROCESS 
//////////////////////////////////////////////////
const raw = {
    name: `raw`,
    description: `Directly log lines to write/output stream.`,
    alias: `r`,
    examples: [
        `{app} -raw 'rollup -c -w'`,
        `{app} -r 'rollup -c -w'`
    ],
    isFlag: true,
    help: `When using {app} programatically "transform" method is still called before writing.`
};
const maxProcesses = {
    name: `raw`,
    description: `Specify the max number of processes.`,
    alias: `x`,
    examples: [
        `{app} -max-processes 5 'rollup -c -w'`,
        `{app} -x 5 'rollup -c -w'`
    ],
    isFlag: true,
    help: `Defines the maximum number of children that may be spawned. When using programatically this also applies to command dependents that are spawned.`
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
    colors
};
exports.default = configs;
//# sourceMappingURL=help.js.map