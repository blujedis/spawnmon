
import yargsParser, { Arguments, Configuration } from 'yargs-parser';
import ansiColors, { StyleFunction } from 'ansi-colors';
import { HelpConfigs, IHelpItem } from './help';
import { ICommandOptions, ISpawnmonOptions } from '../types';

export type Case = 'upper' | 'lower' | 'cap' | 'dash' | 'snake' | 'title' | 'dot' | 'camel';

export type ToArrayType = string | boolean | number;


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
 * Converts help config objects to Yargs Parser config objects.
 * 
 * @param helpItems the configuration object to be converted.
 */
export function toYargsOptions(items: HelpConfigs, configuration: Partial<Configuration> = {}) {

  const boolean = [];
  const number = [];
  const array = [];
  const string = [];
  const defaults = {} as any;
  const alias = {} as any;
  const coerce = {} as any;
  let aliases = [];

  for (const k in items) {

    const conf = items[k] as IHelpItem;
    const isArray = conf.type.startsWith('[');
    const type = isArray ? conf.type.replace(/(\[|\])/g, '') : conf.type;

    if (isArray)
      array.push({ key: k, [type]: true });
    else if (type === 'number')
      number.push(k);
    else if (type === 'boolean')
      boolean.push(k);
    else
      string.push(k);

    if (conf.default)
      defaults[k] = conf.default;

    if (conf.alias) {
      const arr = toArray(conf.alias);
      aliases = [...aliases, ...arr];
      alias[k] = arr;
    }

    if (conf.coerce)
      coerce[k] = conf.coerce;

  }

  const options = {
    string,
    boolean,
    number,
    array,
    default: defaults,
    alias,
    coerce,
    configuration
  };

  return {
    options,
    aliases
  };

}

/**
 * Sorts arrays and parses into keyed object.
 * 
 * @param options the parsed options object.
 */
function argsToObj<T extends Record<string, any[]>>(options?: T) {

  const obj = {} as { [K in keyof T]: { [key: string]: any[] } };

  for (const k in options) {

    options[k] = options[k] || [] as any;

    const args = options[k].sort((a, b) => {
      if (a[0] < b[0])
        return -1;
      else if (a[0] > b[0])
        return 1;
      else
        return 0;
    });

    obj[k] = args.reduce((a, c) => {
      const index = c.shift();
      a[index] = c;
      return a;
    }, {} as { [key: string]: any[] });

  }

  return obj;

}

/**
 * Builds commands into configuration for Spawnmon.
 * 
 * @param commands takes string commands to parse.
 * @param as optional as or labels to run commands "as".
 */
export function toCommands(commands: string[], options?: Record<string, any>) {

  // Store array of child commands meaning
  const children = [];

  const normalized = argsToObj(options);

  let _commands = [...commands].map((v, index) => {
    const args = v.match(/('.*?'|".*?"|\S+)/g);
    const command = args.shift() as string;
    return {
      command,
      args,
      index,
      as: command + '-' + index,
      group: undefined as string,
      color: undefined as string,
      delay: undefined as number,
      mute: undefined as boolean,
      timer: undefined as any,
      pinger: undefined as any
    };
  });

  const getOpts = (key: string, index: number) => {
    const typeOpts = normalized[key] || {};
    return (typeOpts[index] || []);
  };

  const getCmdName = (index) => {
    if (!_commands[index])
      return undefined;
    return _commands[index].as;
  };

  _commands = _commands.map((cmd, index) => {

    const [tSource, tTarget, interval] = getOpts('onTimer', index);
    const [pSource, pTarget, retries] = getOpts('onPinger', index);
    const [host, port] = getOpts('onPingerAddress', index);

    const timerChild = getCmdName(tTarget);
    const pingerChild = getCmdName(pTarget);

    if (timerChild)
      children.push(timerChild);

    if (pingerChild)
      children.push(pingerChild);

    cmd = {
      ...cmd,
      group: getOpts('group', index).shift(),
      color: getOpts('color', index).shift(),
      delay: getOpts('delay', index).shift(),
      mute: getOpts('mute', index).shift(),
      timer: {
        name: getCmdName(tSource),
        target: getCmdName(tTarget),
        interval
      },
      pinger: {
        name: getCmdName(pSource),
        target: getCmdName(pTarget),
        host,
        port,
        retries
      }
    };

    return cmd;

  });

  return {
    commands: _commands,
    children: children
  };

}

/**
 * Parses commands and destructures options into 
 * Spawnmon commands and options.
 * 
 * @param parsed the minimist parsed arguments.
 */
export function toConfig(parsed: Arguments) {


  const {
    _, color, delay, mute, onTimer, version,
    onPinger, onPingerAddress, group,
    ...options
  } = parsed;

  const extended = {
    group,
    color,
    delay,
    mute,
    onTimer,
    onPinger,
    onPingerAddress
  };

  const { commands, children } =
    toCommands(_, extended) as { children: string[], commands: ICommandOptions[] };

  return {
    commands,
    children,
    options: options as ISpawnmonOptions,
  };

}

/**
 * Removes unnecessary keys.
 * 
 * @param keys the keys to filter/remove.
 * @param options the object to be filtered.
 */
export function filterOptions(keys: string[], options: Record<string, any>) {

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

/**
 * Colorizes a string.
 * 
 * @param str the string to be stylized.
 * @param style a style or dot notation string of styles.
 * @param styles rest param of styles.
 */
export function stylizer(str: string, style: string | keyof StyleFunction, ...styles: (keyof StyleFunction)[]) {

  if (style.includes('.')) {
    const segments = style.split('.') as (keyof StyleFunction)[];
    styles = [...segments, ...styles];
  }
  else if (ansiColors[style]) {
    styles.unshift(style as keyof StyleFunction);
  }

  return styles.reduce((result, style) => {
    if (!ansiColors[style])
      return result;
    return ansiColors[style](result);
  }, str);

}

/**
 * Ensures value is an array.
 * 
 * @param value the value to ensure as array.
 * @param def the default value if undefined or null.
 */
export function toArray<T = string>(value: any, def = []): T[] {
  if (typeof value === 'undefined' || value === null)
    return def;
  if (Array.isArray(value))
    return value;
  return [value];
}

export function changeCase(str: string, casing: Case, preTrim = true) {

  // Normalizer, from here we can make several cases.
  // Not complete just handy enough for here.
  const preflight = s => {
    if (!s) return '';
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

/**
 * Formats string matching template expression replacing with key values in object.
 * 
 * @param str the string to be formated.
 * @param obj the object to use for mapping values.
 */
export function simpleFormatter<R extends Record<string, string>>(str: string, obj: R, exp?: RegExp): string;

/**
 * Formats strings matching template expression replacing with key values in object.
 * 
 * @param str the string to be formated.
 * @param obj the object to use for mapping values.
 */
export function simpleFormatter<R extends Record<string, string>>(str: string[], obj: R, exp?: RegExp): string[];

export function simpleFormatter<R extends Record<string, string>>(str: string | string[], obj: R, exp = TEMPLATE_EXP) {

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

/**
 * Converts a property to a cli flag.
 * 
 * @param values the values to convert to flags.
 */
export function toFlag(value: string): string;

/**
 * Converts a properties to a cli flags.
 * 
 * @param values the values to convert to flags.
 */
export function toFlag(...values: string[]): string[];
export function toFlag(...values: string[]) {
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

/**
 * Removes either -- or - from value.
 * 
 * @param value the value to unflag
 */
export function unflag(value: string) {
  if (typeof value === 'undefined') return;
  return value.replace(/^--?/, '');
}

export function createError(errOrMessage: string | Error) {
  let err = errOrMessage as Error;
  if (typeof errOrMessage === 'string')
    err = new Error(errOrMessage);
  err.message = stylizer(err.message, 'red');
  return err;
}