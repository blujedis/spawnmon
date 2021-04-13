import yargsParser from 'yargs-parser';
import { DEFAULT_GROUP_NAME, Spawnmon } from '../spawnmon';
import { readFileSync } from 'fs';
import table from './table';
import helpItems, { HelpGroupKey, HelpKey, IHelpItem } from './help';
import { changeCase, filterOptions, simpleFormatter, stylizer, toArray, toConfig, toFlag, toYargsOptions, unflag } from './utils';
import { join } from 'path';
import { StyleFunction } from 'ansi-colors';

type PaddingKey = 'top' | 'bottom' | 'both' | 'none';

const { name, ...pkg } =
  JSON.parse(readFileSync(join(__dirname, '../../package.json')).toString());

const DEFAULT_MAP = {
  app: name,
  ...pkg
};

const { templates, ...rest } = helpItems;

// Simple api for managing commands.

export function initApi(argv: any[]) {

  let firstArg = unflag(argv[0] || '');
  firstArg = (firstArg === 'h' || firstArg === 'help' ? '' : firstArg);

  const yargsConfig = {
    'strip-dashed': true,
    'greedy-arrays': false
  };

  const { aliases, options } = toYargsOptions(helpItems, yargsConfig);
  const parsed = yargsParser(argv, options);
  const config = toConfig(parsed);
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

    const confs = Object.keys(rest).reduce((result, key) => {

      const conf = buildHelpItem(key as HelpKey);

      if (!groups.includes(conf.group))
        groups.push(conf.group);

      result[conf.group] = result[conf.group] || {};
      result[conf.group][conf.name] = conf;

      return result;

    }, {});

    type tuple = [HelpGroupKey[], { [K in HelpGroupKey]: { [key: string]: ReturnType<typeof buildHelpItem> } }]

    return [groups, confs] as tuple;

  };

  const padLine = (value: string | string[], padding: PaddingKey): string[] => {
    let rows = [];
    if (!Array.isArray(value))
      value = [value];
    if (padding === 'none')
      return (value as string[]);
    if (padding === 'both' || padding === 'top')
      rows.push('');
    rows = [...rows, ...value];
    if (padding === 'both' || padding === 'bottom')
      rows.push('');
    return rows as string[];
  };

  const getSectionHeader = (label: string, color?: keyof StyleFunction | string, padding: PaddingKey = 'bottom', indent = '') => {
    label = indent + label;
    if (color)
      label = stylizer(label, color);
    const rows = padLine(indent + label, padding);
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

  // Spawnmon has no commands so first arg must be
  // either a flag option or start with a " or '
  function isValidFirstArg(arg) {
    return /^--?/.test(arg) || /^("|')/.test(arg);
  }

  // Public Methods

  const show = {

    logo: (padding: PaddingKey = 'none') => {
      const lines = padLine(' ' + templates.logo, padding);
      return console.log(lines.join('\n'));
    },

    header: (usage = true, padding?: boolean) => console.log(getHeader(usage, padding).join('\n')),

    section: (label: string, color?: keyof StyleFunction | string, padding: PaddingKey = 'bottom', indent = '') => console.log(getSectionHeader(label, color, padding, indent).join('\n')),

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
      show.section('examples:', 'green');
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

    pad: (count = 1) => console.log('\n'.repeat(count)),

    message: (msg: string, color?: string, padding: PaddingKey = 'both') => {
      if (color)
        msg = stylizer(msg, color);
      const lines = padLine(msg, padding);
      console.log(lines.join('\n'));
    },

    help: (key: string = firstArg) => {

      // If no help key then 
      if (!hasHelpArg(key)) {
        show.header(true, false);
        show.groups('blue');
        console.log();
        return;
      }

      show.logo('none');

      if (key == 'examples')
        show.examples('blue');

      return show.item(key as HelpKey, 'blue');

    }

  };

  const hasFlag = (...flag: string[]) => {
    return flags.some(v => flag.includes(unflag(v)));
  };

  const hasCommand = (...command: string[]) => {
    return commands.some(v => command.includes(v));
  };

  const hasFlags = () => !!Object.keys(flags).length;

  const hasCommands = () => !!commands.length;

  const hasHelp = () => {
    return hasFlag('h', 'help');
  };

  const hasHelpArg = (key = firstArg) => {
    return key && hasFlag(firstArg) && hasHelp();
  };

  const run = () => {
    const { commands, children, options } = config;
    const cleaned = filterOptions([...aliases, 'version'], options);
    const spawnmon = new Spawnmon(cleaned);
    commands.forEach(opts => {
      const cmd = spawnmon.create(opts);
      // only assign to runnable group is not
      // dependent on parent parent command.
      if (!children.includes(cmd.name))
        cmd.assign(DEFAULT_GROUP_NAME);
    });
    spawnmon.run();
  };

  return {
    argv,
    config,
    hasFlags,
    hasCommands,
    hasCommand,
    hasFlag,
    hasHelp,
    hasHelpArg,
    firstArg,
    run,
    show
  };

}

export default initApi(process.argv.slice(2));

