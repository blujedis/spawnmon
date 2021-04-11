import { ParsedArgs } from 'minimist';
import { Spawnmon } from '../spawnmon';
import { readFileSync } from 'fs';
import table from './table';
import helpItems, { HelpGroupKey, HelpKey, IHelpItem, IHelpItemGrouped } from './help';
import { changeCase, simpleFormatter, stylizer, toArray, toConfig, toFlag } from './utils';
import { join } from 'path';
import { StyleFunction } from 'ansi-colors';

const { name, ...pkg } =
  JSON.parse(readFileSync(join(__dirname, '../../package.json')).toString());

const DEFAULT_MAP = {
  app: name,
  ...pkg
};

const { templates } = helpItems;

export function initApi(parsed: ParsedArgs) {

  const config = toConfig(parsed);
  const spawnmon = new Spawnmon({ ...config.options });
  const flags = Object.keys(config.options);
  const commands = Object.keys(config.commands);

  // Private Methods

  const formatItemProps = (conf: IHelpItem) => {

    const map = { ...DEFAULT_MAP, ...conf };

    return {
      name: toFlag(changeCase(conf.name, 'dash')),
      alias: toArray(conf.alias).map(v => toFlag(v)).join(', '),
      description: simpleFormatter(conf.description, map),
      type: conf.type,
      help: toArray(conf.help).map(h => simpleFormatter(h, map)),
      examples: toArray(conf.examples).map(e => simpleFormatter(e, map)),
      group: conf.group,
      isFlag: conf.isFlag
    };

  };

  const buildHelpItem = <K extends HelpKey>(key: K) => {

    const conf = helpItems[key] as IHelpItem;
    const { name, alias, description, type, help, examples, group } = formatItemProps(conf);

    const row = [name, alias, description, type];

    return {
      name,
      row,
      help,
      examples,
      group
    };

  };

  const buildHelpItems = () => {

    const groups: HelpGroupKey[] = [];
    const { templates, ...rest } = helpItems;

    const confs = Object.keys(rest).reduce((result, key) => {

      const conf = buildHelpItem(key as HelpKey);

      if (!groups.includes(conf.group))
        groups.push(conf.group);

      result[conf.group] = result[conf.group] || {};
      result[conf.group][conf.name] = conf;
      // [...result[conf.group], conf.row];
      return result;

    }, {});

    type tuple = [HelpGroupKey[], { [K in HelpGroupKey]: { [key: string]: ReturnType<typeof buildHelpItem> } }]

    return [groups, confs] as tuple;

  };

  const getSectionHeader = (label: string, color?: keyof StyleFunction | string, padding: 'top' | 'bottom' | 'both' | 'none' = 'bottom', indent = '') => {
    label = indent + label;
    if (color)
      label = stylizer(label, color);
    const rows = [
      indent + label,
    ];
    if (padding === 'top' || padding === 'both')
      rows.unshift('');
    if (padding === 'bottom' || padding === 'both')
      rows.push('');
    return rows;
  };

  const getHeader = (usage = true, padding?: boolean) => {
    const lines = [];
    lines.push(' ' + templates.logo); // need space for logo alignment.
    if (!usage && padding || usage)
      lines.push('');
    if (usage) {
      lines.push(stylizer(simpleFormatter(templates.usage, DEFAULT_MAP), 'cyan'));
      lines.push('');
      lines.push(stylizer(simpleFormatter(`detailed help: {app} --some-option -h`, DEFAULT_MAP), 'dim.italic'));
      if (padding)
        lines.push('');
    }
    return lines;
  };

  const show = {

    header: (usage = true, padding?: boolean) => console.log(getHeader(usage, padding).join('\n')),

    section: (label: string, color?: keyof StyleFunction | string, padding: 'top' | 'bottom' | 'both' | 'none' = 'bottom', indent = '') => console.log(getSectionHeader(label, color, padding, indent).join('\n')),

    groups: (color?: keyof StyleFunction | string) => {

      const [groups, confs] = buildHelpItems();

      groups.forEach(k => {
        const tree = confs[k];
        show.section(k + ':', color, 'both');
        const rows = [];
        Object.keys(tree).forEach(n => rows.push(tree[n].row));
        const str = table
          .init()
          .rows(...rows)
          .border('none')
          .width(18, 10, 45)
          .align('columns', 'left', 'left', 'left', 'right')
          .wrapped()
          .toString();
        console.log(str);
      });

    },

    item: (key: HelpKey, color?: string) => {
      const item = buildHelpItem(key);
      show.section(item.name + `:`, color, 'both');
      show.section(item.help.map(h => '  ' + h).join('\n'), 'dim');
      show.section('examples:', 'yellow');
      show.section(item.examples.map(ex => '  ' + ex).join('\n'));
      console.log();
    },

    examples: (color?: keyof StyleFunction | string) => {

      const [groups, confs] = buildHelpItems();

      groups.forEach(k => {
        const tree = confs[k];
        show.section(k + ':', color, 'both');
        let rows = [];
        Object.keys(tree).forEach((n, i) => {
          const padKey = i === 0 ? 'bottom' : 'both';
          const itemHdr = getSectionHeader(n, null, padKey);
          rows.push(...itemHdr);
          const ex = tree[n].examples.map(line => stylizer('  ' + line, 'dim'));
          rows = [...rows, ...ex];
        });
        console.log(rows.join('\n') + '\n');
      });


    },

    pad: (count = 1) => console.log('\n'.repeat(count))

  };

  // Public Methods

  const hasFlag = (...flag: string[]) => {
    return flags.some(v => flag.includes(v));
  };

  const hasCommand = (...command: string[]) => {
    return commands.some(v => command.includes(v));
  };

  const run = () => {
    config.commands.forEach(opts => {
      spawnmon.add(opts);
    });
  };

  const showHelp = (key?: HelpKey | 'examples') => {

    // If no help key then 
    if (!key) {
      show.header(true, false);
      show.groups('blue');
      return;
    }

    if (key !== 'examples')
      show.item('prefix', 'blue');
    else
      show.examples('blue');

  };

  return {
    config,
    hasCommand,
    hasFlag,
    run,
    showHelp
  };

}

