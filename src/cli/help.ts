import { stylizer } from './utils';
import { readFileSync } from 'fs';
import { join } from 'path';

const logo = readFileSync(join(__dirname, './logo.txt')).toString().trim();

export type HelpConfigs = typeof configs;
export type HelpKey = keyof HelpConfigs;
export type HelpItem<K extends HelpKey> = HelpConfigs[K];
export type Help = { [K in HelpKey]: HelpConfigs[K] };

export interface IHelpItem {
  name: string;
  description: string;
  alias: string | string[];
  examples: string[];
  isFlag: boolean;
  help: undefined | string | string[];
  type: string;
  group: 'prefix' | 'misc' | 'styling' | 'process'
}

//////////////////////////////////////////////////
// MISC 
//////////////////////////////////////////////////

const usage = `{app} [options] <commands...>`;

const version: IHelpItem = {
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

const prefix: IHelpItem = {
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
  ],
  type: 'string',
  group: 'prefix'
};

const prefixFill: IHelpItem = {
  name: `prefixFill`,
  description: `Prefix alignment fill char`,
  alias: `f`,
  examples: [
    `{app} -prefix-fill ' ' 'rollup -c -w'`,
    `{app} -f '.' 'rollup -c -w'`
  ],
  isFlag: true,
  help: [
    `Specify any single character to be used as "fill" when aligning prefixes.`
  ],
  type: 'string',
  group: 'prefix'
};

const prefixMax: IHelpItem = {
  name: `prefixMax`,
  description: `The maximum prefix length.`,
  alias: `m`,
  examples: [
    `{app} -prefix-max 8 'rollup -c -w'`,
    `{app} -m 8 'rollup -c -w'`
  ],
  isFlag: true,
  help: `When {name} is enabled the prefix including templating cannot exceed this this length. This ensures a cleaner looking terminal.`,
  type: 'number',
  group: 'prefix'
};

const prefixAlign: IHelpItem = {
  name: `prefixAlign`,
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
    `\n${stylizer('[...rollup...]', 'dim')}\n4{stylizer('[react-scripts]', 'dim')}`,
    `Use --prefix-fill to define the fill char "." or maybe a space " " when using alignment.`
  ],
  type: 'string',
  group: 'prefix'
};

const labels: IHelpItem = {
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
  help: `Display the current version for {app}.`,
  type: '[string]',
  group: 'prefix'
};

const colors: IHelpItem = {
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
  help: `Display the current version for {app}.`,
  type: '[string]',
  group: 'prefix'
};

//////////////////////////////////////////////////////////
// STYLING
///////////////////////////////////////////////////////////

const defaultColor: IHelpItem = {
  name: `defaultColor`,
  description: `The default color for line prefixes.`,
  alias: `d`,
  examples: [
    `{app} --default-color dim 'rollup -c -w'`,
    `{app} -d bgRed.yellow 'rollup -c -w'`
  ],
  isFlag: true,
  help: [
    `The default color applies to all prefixes use '--colors' to apply custom colors to each command.`
  ],
  type: 'string',
  group: 'styling'
};

const condensed: IHelpItem = {
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
  group: 'styling'

};

//////////////////////////////////////////////////
// STREAMS & PROCESS 
//////////////////////////////////////////////////

const raw: IHelpItem = {
  name: `raw`,
  description: `Directly log lines to write/output stream.`,
  alias: `r`,
  examples: [
    `{app} -raw 'rollup -c -w'`,
    `{app} -r 'rollup -c -w'`
  ],
  isFlag: true,
  help: `When using {app} programatically "transform" method is still called before writing.`,
  type: 'boolean',
  group: 'process'
};

const maxProcesses: IHelpItem = {
  name: `maxProcess`,
  description: `Specify the max number of processes.`,
  alias: `x`,
  examples: [
    `{app} -max-processes 5 'rollup -c -w'`,
    `{app} -x 5 'rollup -c -w'`
  ],
  isFlag: true,
  help: `Defines the maximum number of children that may be spawned. When using programatically this also applies to command dependents that are spawned.`,
  type: 'number',
  group: 'process'
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

export default configs;