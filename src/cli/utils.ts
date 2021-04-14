
import yargsParser, { Arguments, Configuration } from 'yargs-parser';
import ansiColors, { StyleFunction } from 'ansi-colors';
import { HelpConfigs, IHelpItem } from './help';
import { ICommandOptions, ISpawnmonOptions } from '../types';

export type Case = 'upper' | 'lower' | 'cap' | 'dash' | 'snake' | 'title' | 'dot' | 'camel';

export type ToArrayType = string | boolean | number;

export interface IParseCommandOptions {
  as: string[];
  colors: string[];
  delay: number[];
  mute: string[];
  onTimer: { name: string, target: string, interval?: number }[];
  onPinger: { name: string, target: string, host?: string, port?: number }[];
}

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
export function toYargsOptions(helpItems: HelpConfigs, configuration: Partial<Configuration> = {}) {

  const { templates, ...clean } = helpItems;

  const boolean = [];
  const number = [];
  const array = [];
  const string = [];
  const defaults = {} as any;
  const alias = {} as any;
  const coerce = {} as any;
  let aliases = [];

  for (const k in clean) {

    const conf = clean[k] as IHelpItem;
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
 * Builds commands into configuration for Spawnmon.
 * 
 * @param commands takes string commands to parse.
 * @param as optional as or labels to run commands "as".
 */
export function toCommands(commands: string[], options?: IParseCommandOptions) {

  const { as, colors, delay, mute, onTimer, onPinger } = options;

  // Store array of child commands meaning
  // they depend on a command that calls them
  // after ping or timer expires.
  const children = [];

  const getIndexed = (cmd, arr = []) => arr.filter(c => {
    return c.name === cmd;
  })[0];

  const _commands = commands.map((v, index) => {

    const args = v.match(/('.*?'|".*?"|\S+)/g);
    const command = args.shift() as string;
    const _mute = typeof toArray(mute)[index] === 'string' ? true : false;
    const timer = getIndexed(command, onTimer);
    const pinger = getIndexed(command, onPinger);
    const name = ((as && as[index]) || command) as string;

    if (timer && timer.target)
      children.unshift(timer.target);

    if (pinger && pinger.target)
      children.unshift(pinger.target);

    const opts = {
      command,
      args,
      as: name,
      color: toArray(colors)[index],
      delay: toArray<number>(delay)[index],
      mute: _mute,
      timer,
      pinger
    };

    return opts;

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
    _, as, labels, colors, delay, mute, onTimer,
    version, onPinger,
    ...options
  } = parsed;

  const extended = {
    as: as || labels,
    colors,
    delay,
    mute,
    onTimer,
    onPinger
  };

  const { commands, children } = toCommands(_, extended) as { children: string[], commands: ICommandOptions[] };

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