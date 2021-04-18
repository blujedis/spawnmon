import { stylizer } from './utils';
const DEFAULT_TRANSFORM = (v => v);
const DIGIT_EXP = /^\d+$/;
const toInt = (val) => {
    if (typeof val === 'undefined' || val === null)
        return val;
    if (val === '')
        return undefined;
    return parseInt(val, 10);
};
// Simple helper to coerce arrays to the correct type.
const coerceToArray = (transform = DEFAULT_TRANSFORM) => (arr) => {
    arr = arr.reduce((a, c, i) => {
        c += '';
        const isCSV = c.includes(',');
        c = c.split(',').map(v => v.trim()); // split csv args.
        c = c.map((v, x) => {
            v = v.split(':');
            const idx = isCSV ? x : i; // if csv idx is curr in map otherwise from reducer. 
            return transform(v, idx);
        });
        return [...a, c];
    }, []);
    return arr.flat();
};
//////////////////////////////////////////////////
// MISC 
//////////////////////////////////////////////////
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
// SPAWNMON OPTIONS 
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
    group: 'spawnmon'
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
    group: 'spawnmon'
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
    help: `When prefix is enabled the prefix including templating cannot exceed this this length. This ensures a cleaner looking terminal.`,
    type: 'number',
    group: 'spawnmon'
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
        `\n${stylizer('[...rollup...]', 'dim')}\n4{stylizer('[react-scripts]', 'dim')}`,
        `Use --prefix-fill to define the fill char "." or maybe a space " " when using alignment.`
    ],
    type: 'string',
    group: 'spawnmon'
};
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
    group: 'spawnmon'
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
    group: 'spawnmon'
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
    group: 'spawnmon'
};
const raw = {
    name: `raw`,
    description: `Directly log lines to write/output stream.`,
    alias: `w`,
    examples: [
        `{app} --raw 'rollup -c -w'`,
        `{app} -w 'rollup -c -w'`
    ],
    isFlag: true,
    help: `When using {app} programatically "transform" method is still called before writing.`,
    type: 'boolean',
    group: 'spawnmon'
};
const pipeInput = {
    name: `pipeInput`,
    description: `Pipes stdin to the specified command.`,
    alias: `i`,
    examples: [
        `{app} --pipe-input 1 'rollup -c -w' 'nodemon'`,
        `{app} -i=1 'rollup -c -w' 'nodemon'`,
    ],
    isFlag: true,
    help: `By piping the stdin stream to a specific command you can still issue commands like "rs" to restart Nodemon and have it function as expected.`,
    type: 'number',
    group: 'spawnmon'
};
const sendEnter = {
    name: `sendEnter`,
    description: `When true sends enter key signal to terminal.`,
    alias: `s`,
    examples: [
        `{app} --send-enter 'rollup -c -w' 'nodemon'`,
        `{app} -s 'rollup -c -w' 'nodemon'`,
    ],
    isFlag: true,
    help: `When killing commands you'll notice that you may not return to your normal prompt. This happens with other runners like concurrently. Yes you can just ctrl-c again but my anal retentive ass hates it. So in complete overkill this enables RobotJS to send that key to the terminal. Keep in mind on Mac for example you'll be required to authorize VSCode to allow this action. In short it's handy but completely unnecessary.`,
    type: 'boolean',
    group: 'spawnmon'
};
//////////////////////////////////////////////////
// COMMAND OPTIONS 
//////////////////////////////////////////////////
const group = {
    name: `group`,
    description: `Assigns a group name to a command.`,
    alias: `g`,
    examples: [
        `{app} --group 0:lib 'rollup -c -w' 'react-scripts start'`,
        `{app} -g 0:lib,1:web 'rollup -c -w' 'react-scripts start'`,
        `{app} --group=0:lib 'rollup -c -w' 'react-scripts start'`,
        `{app} --group=lib,web 'rollup -c -w' 'react-scripts start'`,
    ],
    isFlag: true,
    help: `A group name to assign the command to. The prefix displayed in logs will show this group name instead of the command name. This can be helpful when mulitple of the same command are run, essentially showing you an alias show you know which has been run.`,
    type: '[string]',
    group: 'command',
    coerce: coerceToArray((arr, idx) => {
        if (!DIGIT_EXP.test(arr[0]))
            arr.unshift(idx);
        arr[0] = toInt(arr[0]);
        return arr;
    })
};
const color = {
    name: `color`,
    description: `Specify prefix color by name or index.`,
    alias: 'c',
    examples: [
        `{app} --color cyan 'rollup -c -w' 'react-scripts start'`,
        `{app} -c cyan 'rollup -c -w' 'react-scripts start'`,
        `{app} -c=1:blue,0:cyan 'rollup -c -w' 'react-scripts start'`,
    ],
    isFlag: true,
    help: `Display the current version for {app}.`,
    type: '[string]',
    group: 'command',
    coerce: coerceToArray((arr, idx) => {
        if (!DIGIT_EXP.test(arr[0]))
            arr.unshift(idx);
        arr[0] = toInt(arr[0]);
        return arr;
    })
};
const delay = {
    name: `raw`,
    description: `Delays the start of the command.`,
    alias: `d`,
    examples: [
        `{app} --delay 500 'rollup -c -w'`,
        `{app} -d 1:800 'rollup -c -w' 'react-scripts start'`,
        `{app} -d 0:500,1:800 'rollup -c -w' 'react-scripts start'`
    ],
    isFlag: true,
    help: `When using {app} you can delay the start of individual scripts. There are various reasons why you might want to do this. One might be to make logs easier to read since spawn processes fire off at once.`,
    type: '[string]',
    group: 'command',
    coerce: coerceToArray((arr, idx) => {
        if (arr.length === 1)
            arr.unshift(idx);
        arr[0] = toInt(arr[0]);
        return arr;
    })
};
const mute = {
    name: `mute`,
    description: `Mutes the output of a given spawned process.`,
    alias: `u`,
    examples: [
        `{app} --mute 0 'rollup -c -w'`,
        `{app} -u=1 'rollup -c -w' 'react-scripts start'`,
        `{app} -u=1,0 'rollup -c -w' 'react-scripts start'`,
    ],
    isFlag: true,
    help: `Specifying mute for a command/process will silence that command's output.`,
    type: '[string]',
    group: 'command',
    coerce: coerceToArray((arr, idx) => {
        arr[0] = toInt(arr[0]);
        arr.push(true);
        return arr;
    })
};
const onTimeout = {
    name: `onTimeout`,
    description: `Maps process to run on timer idle for process.`,
    alias: [`o`],
    examples: [
        `{app} --on-timeout 0:1 'rollup -c -w' 'echo "rollup idle"'`,
        `{app} -o 1 'rollup -c -w' 'echo "rollup idle"'`,
        `{app} -o 0:1:2500 'rollup -c -w' 'echo "rollup idle"'`
    ],
    isFlag: true,
    help: `On timer waits for a stream to become stale, essentially stops outputting to terminal, then runs the specified command. Accepts source:target:2500, Example 0:1:2500 meaning from command 0 run command 1 after timeout.`,
    type: '[string]',
    group: 'command',
    coerce: coerceToArray((arr, idx) => {
        if (arr[0] === '')
            arr[0] = idx;
        if (arr.length === 1 || (arr.length === 2 && arr[1].length >= 3))
            arr.unshift(idx);
        arr[0] = toInt(arr[0]);
        arr[1] = toInt(arr[1]);
        if (arr[2])
            arr[2] = toInt(arr[2]);
        if (isNaN(arr[0]) || isNaN(arr[1]))
            return [];
        return arr;
    })
};
const onConnect = {
    name: `onConnect`,
    description: `Enables running command after ping successfully connects.`,
    alias: [`e`],
    examples: [
        `{app} --on-connect 0:1 'react-scripts start' 'electron .'`,
        `{app} -e 0:1:10 'electron .' 'react-scripts start'`
    ],
    isFlag: true,
    help: `The on pinged flag creates a socket and pings the host/port until aborted or connected. If the socket connects it auto closes and then launches the next command, Accepts source, target and retries. Example 0:1:10 which would be the 0 index command will start pinging and when connected will call command at index 1 and will retry 10 times or exit.`,
    type: '[string]',
    group: 'command',
    coerce: coerceToArray((arr, idx) => {
        if (arr[0] === '')
            arr[0] = idx;
        if (arr.length === 1 || (arr.length === 2 && toInt(arr[1]) >= 5))
            arr.unshift(idx);
        arr[0] = toInt(arr[0]);
        arr[1] = toInt(arr[1]);
        if (arr[2])
            arr[2] = toInt(arr[2]);
        if (isNaN(arr[0]) || isNaN(arr[1]))
            return [];
        return arr;
    })
};
const onConnectAddress = {
    name: `onConnectAddress`,
    description: `Specifies the host and port for socket/ping.`,
    alias: [`r`],
    examples: [
        `{app} --on-connect-address 127.0.0.1 'react-scripts start' 'electron .'`,
        `{app} -r 127.0.0.1:5000 'electron .' 'react-scripts start'`
    ],
    isFlag: true,
    help: `When using onPinger you can set the address in the format of host:port. Example 127.0.0.1:3000. The default host is 127.0.0.1 and the default port is 3000.`,
    type: '[string]',
    group: 'command',
    coerce: coerceToArray((arr, idx) => {
        if (arr[0] === '')
            arr[0] = idx;
        if (arr.length === 1 || arr[0].includes('.')) // 1 arg or host is second arg.
            arr.unshift(idx);
        if (arr[2])
            arr[2] = toInt(arr[2]);
        return arr;
    })
};
export const usage = `usage: {app} [options] <commands...>`;
export const configs = {
    raw,
    maxProcesses,
    prefixAlign,
    defaultColor,
    condensed,
    prefix,
    prefixFill,
    prefixMax,
    version,
    pipeInput,
    sendEnter,
    group,
    color,
    delay,
    mute,
    onTimeout,
    onConnect,
    onConnectAddress
};
//# sourceMappingURL=help.js.map