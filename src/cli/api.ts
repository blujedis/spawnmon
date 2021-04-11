import { ParsedArgs } from 'minimist';
import { Spawnmon } from '../spawnmon';
import { readFileSync } from 'fs';
import table from './table';
import help, { HelpItem, HelpKey, IHelpItem } from './help';
import { simpleFormatter, stylizer, toConfig, toFlag } from './utils';
import { join } from 'path';
import { StyleFunction } from 'ansi-colors';

const PACKAGE =
  JSON.parse(readFileSync(join(__dirname, '../../package.json')).toString());

const DEFAULT_MAP = {
  app: PACKAGE.name,
  ...PACKAGE
};

const { templates } = help;
const nl = (c = 1) => c === 0 ? '' : '\n'.repeat(c);

export function initApi(parsed: ParsedArgs) {

  const config = toConfig(parsed);
  const spawnmon = new Spawnmon({ ...config.options });

  const flags = Object.keys(config.options);
  const commands = Object.keys(config.commands);

  // Private Methods

  const toArrayProp = (prop, def = []) => {
    if (typeof prop === 'undefined')
      return def;
    if (!Array.isArray(prop))
      prop = [prop];
    return prop;
  };

  const formatItemProps = (conf: IHelpItem) => {
    const { description, help, examples } = conf;
    const map = { ...DEFAULT_MAP, ...conf };
    return {
      description: simpleFormatter(description, map),
      help: (help as string[]).map(h => simpleFormatter(h, map)),
      examples: (examples as string[]).map(e => simpleFormatter(e, map)),
    };
  };

  const buildHelpItem = <K extends HelpKey>(key: K) => {
    const conf = help[key] as IHelpItem;
    const cols = [];
    conf.alias = toArrayProp(conf.alias);
    conf.examples = toArrayProp(conf.examples);
    conf.help = toArrayProp(conf.help);
    const alias = (conf.alias as string[]).map(v => toFlag(v));

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

  const getSection = (label: string, color?: keyof StyleFunction, indent = '') => {
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
      lines = [...getSection('Commands', 'blueBright')];
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

