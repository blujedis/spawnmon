import { ParsedArgs } from 'minimist';
import { Spawnmon } from '../spawnmon';
import { readFileSync } from 'fs';
import table from './table';
import helpItems, { HelpItem, HelpKey, IHelpItem } from './help';
import { changeCase, simpleFormatter, stylizer, toConfig, toFlag } from './utils';
import { join } from 'path';
import { StyleFunction } from 'ansi-colors';

const { name, ...pkg } =
  JSON.parse(readFileSync(join(__dirname, '../../package.json')).toString());

const DEFAULT_MAP = {
  app: name,
  ...pkg
};

const { templates } = helpItems;
const nl = (c = 1) => c === 0 ? '' : '\n'.repeat(c);

export function initApi(parsed: ParsedArgs) {

  const config = toConfig(parsed);
  const spawnmon = new Spawnmon({ ...config.options });

  const flags = Object.keys(config.options);
  const commands = Object.keys(config.commands);

  // Private Methods

  const toArrayProp = (prop: string | string[], def = []) => {
    if (typeof prop === 'undefined')
      return def;
    if (!Array.isArray(prop))
      prop = [prop];
    return prop;
  };

  const formatItemProps = (conf: IHelpItem) => {
    const map = { ...DEFAULT_MAP, ...conf };
    return {
      name: toFlag(changeCase(conf.name, 'dash')),
      alias: toArrayProp(conf.alias).map(v => toFlag(v)).join(', '),
      description: simpleFormatter(conf.description, map),
      type: conf.type,
      help: toArrayProp(conf.help).map(h => simpleFormatter(h, map)).join('\n'),
      examples: toArrayProp(conf.examples).map(e => simpleFormatter(e, map)).join('\n')
    };
  };

  const buildHelpItem = <K extends HelpKey>(key: K) => {
    const conf = helpItems[key] as IHelpItem;
    const { name, alias, description, type, help, examples } = formatItemProps(conf);
    const row = [name, alias, description, type];
    return {
      row,
      help,
      examples
    };
  };

  const buildHelpItems = () => {
    
    Object.keys(helpItems).forEach(k => {

    });
  };

  // Public Methods

  const hasFlag = (...flag: string[]) => {
    return flags.some(v => flag.includes(v));
  };

  const hasCommand = (...command: string[]) => {
    return commands.some(v => command.includes(v));
  };

  const getHeader = (usage = true) => {
    const lines = [];
    lines.push(templates.logo);
    lines.push('');
    if (usage)
      lines.push(templates.usage);
    lines.push('');
    return lines;
  };

  const getSectionHeader = (label: string, color?: keyof StyleFunction, indent = '') => {
    label = indent + label;
    if (color)
      stylizer(label, color);
    return [
      indent + label + ':',
      ''
    ];
  };

  const run = () => {
    config.commands.forEach(opts => {
      spawnmon.add(opts);
    });
  };

  const showHelp = (key?: HelpKey) => {

    let lines = [];

    // If no help key then 
    if (!key) {
      lines = [...getHeader()];
      lines = [...getSectionHeader('Commands', 'blueBright')];
    }


  };

  return {
    config,
    hasCommand,
    hasFlag,
    run,
    showHelp
  };

}

