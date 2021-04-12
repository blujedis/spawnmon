import minimist, { ParsedArgs } from 'minimist';
import ansiColors, { StyleFunction } from 'ansi-colors';
import { HelpConfigs } from './help';
import { ICommandOptions, ISpawnmonOptions } from '../types';

export type Case = 'upper' | 'lower' | 'cap' | 'dash' | 'snake' | 'title' | 'dot' | 'camel';

export type ToArrayType = string | boolean | number;

const SPLIT_ARGS_EXP = /('.*?'|".*?"|\S+)/g;

const CSV_EXP = /(\w,?)+/;

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
 * Gets preparred items for minimist.
 * 
 * @param helpItems help configuration items.
 */
export function toMinimistOptions(helpItems: HelpConfigs) {

  // save shorthand aliases so we can 
  // strip them later of options object.
  let aliases = [];

  const options = Object.keys(helpItems).reduce((confs, key) => {

    const conf = helpItems[key];
    let type = conf.type;
    const isArray = type.startsWith('[');

    type = type.replace(/(\[|\])/g, '');
    type = isArray ? type + '-array' : type;

    const alias = toArray(conf.alias);
    aliases = [...aliases, ...alias];

    confs[key] = {
      type,
      alias: conf.alias
    } as any;

    if (typeof conf.default !== 'undefined')
      confs[key].default = conf.default;

    return confs;

  }, {});

  return {
    aliases,
    options
  };

}

/**
 * Ensure a parsed argument is properly converted to an array
 * from string removing {} chars.
 * 
 * @param args args that should be an array.
 */
export function argToArray<T = string>(args: string | string[], type: ToArrayType = 'string', delimiter = ',') {

  // Not a fan of doing all this, change to different parser
  // minimist is mini-miss a lot of things here, too much clean up!

  if (typeof args === 'string') {
    args = args.replace(/({|})/g, '');
    args = args.split(',').map(v => v.trim());
  }

  let _args = toArray<any>(args);

  if (type === 'boolean' || type === 'number') {
    if (type === 'boolean') {
      _args = _args.map(v => {
        if (/^(true|1)$/.test(v))
          return v === true || v === 'true' || v === '1' ? true : false;
        return false;
      });
    }
    else {
      _args = _args.map(v => {
        v = parseFloat(v);
        if (isNaN(v))
          return undefined;
        return v;
      });
    }
  }

  return _args as T[];
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
 * Normalizes, bascially some clean up after minimist parses arguments.
 * 
 * @param parsed the parsed arguments.
 */
export function toNormalized(parsed: ParsedArgs) {

  // Is comma separated value, split to array.
  if (typeof parsed.as === 'string' && CSV_EXP.test(parsed.as)) {
    parsed.as = parsed.as
      .replace(/[[\]{}]/g, '')
      .split(',')
      .map(v => v.trim());
  }

  // TODO: need to do some extra work in here
  // for parsed types etc, too much work to use
  // minimist will switch to more adv parser soon.

  // in this use case no need for '--' as all args props
  // not part of a command can only be consumed by Spawnmon.
  delete parsed['--'];

  for (const k in parsed) {
    if (k.includes('-')) {
      parsed[changeCase(k, 'camel')] = parsed[k];
      delete parsed[k];
    }
  }

  return parsed as Omit<ParsedArgs, '--'>;

}

/**
 * Builds commands into configuration for Spawnmon.
 * 
 * @param commands takes string commands to parse.
 * @param as optional as or labels to run commands "as".
 */
export function toCommands(commands: string[], options?: { as: string[], colors: string[], delay: number[], mute: boolean[] }) {

  const { as, colors, delay, mute } = options;

  // iterate and build the commnds.
  return commands.map((v, index) => {

    const args = v.split(SPLIT_ARGS_EXP).filter(v => {
      return v.length && v !== ' ';
    });

    const command = args.shift();

    return {
      command,
      args,
      index,
      as: (as && as[index]) || command,
      color: colors[index],
      delay: delay[index] as unknown as number,
      mute: mute[index] as unknown as boolean
    };

  });

}

/**
 * Parses commands and destructures options into 
 * Spawnmon commands and options.
 * 
 * @param parsed the minimist parsed arguments.
 */
export function toConfig(parsed: ParsedArgs) {

  const normalized = toNormalized(parsed);

  // Destructure out the commands from
  // Spawnmon flag options.
  // NOTE: labels an alias for "as".
  const { _, as, labels, colors, delay, mute, ...options } = normalized;

  const extended = {
    as: argToArray(as || labels),
    colors: argToArray(colors),
    delay: argToArray<number>(delay, 'number'),
    mute: argToArray<boolean>(mute, 'boolean'),
  };

  const commands = toCommands(_, extended) as ICommandOptions[];

  return {
    commands,
    options: options as ISpawnmonOptions
  };

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