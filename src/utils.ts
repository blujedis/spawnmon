import { redBright } from 'ansi-colors';
import strip from 'strip-ansi';
import wrap from 'wrap-ansi';
import colors from 'ansi-colors';
import { Color } from './types';
import { error, warning, info, success } from 'log-symbols';
import stringLength from 'string-length';
import stringWidth from 'string-width';
import emojiRegex from 'emoji-regex';
import pinger from './pinger';

export { stringLength, stringWidth };

const NEWLINE_EXP = /\r?\n$/u;

const symbols = {
  alert: error,
  caution: warning,
  notice: info,
  success
};

/**
 * Detects line returns if match slices.
 * 
 * @param line the line to be cleaned up.
 */
function chomp(line) {
  const match = NEWLINE_EXP.exec(line);
  if (!match) return line;
  return line.slice(0, match.index);
}

/**
 * Converts chunks into output lines for terminal/console.
 * 
 * @param chunks the chunks to convert to lines.
 */
export async function* chunksToLines(chunks) {

  if (!Symbol.asyncIterator)
    throw new Error('Current JavaScript engine does not support asynchronous iterables');

  if (!(Symbol.asyncIterator in chunks))
    throw new Error('Parameter is not an asynchronous iterable');

  let previous = '';

  for await (const chunk of chunks) {

    previous += chunk;
    let eolIndex;

    while ((eolIndex = previous.indexOf('\n')) >= 0) {
      // line includes the EOL
      const line = previous.slice(0, eolIndex + 1);
      yield line;
      previous = previous.slice(eolIndex + 1);
    }

  }

  if (previous.length > 0)
    yield previous;

}

/**
 * Removes emojis from string.
 * 
 * @param str the string containing emojis.
 */
function stripEmoji(str: string) {
  const exp = emojiRegex();
  return str.replace(exp, '');
}

/**
 * Strips line of ansi styles.
 * 
 * @see https://www.npmjs.com/package/strip-ansi
 * 
 * @param line the line to be stripped.
 */
function stripAnsi(line: string) {
  return strip(line);
}

/**
 * Wraps a line to the defined parameters.
 * 
 * @see https://www.npmjs.com/package/wrap-ansi
 * 
 * @param line the line to be wrapped or constrained as defined.
 * @param columns the number of columns to wrap to.
 * @param options the options for wrapping the line.
 */
function wrapAnsi(
  line: string,
  columns: number,
  options: {
    hard?: boolean;
    trim?: boolean;
    wordWrap?: boolean
  }) {
  return wrap(line, columns, options);
}

/**
 * Checks if line is a blank line after stripping any ansi styles or line returns.
 * 
 * @param line the line to be inspected.
 */
function isBlankLine(line: string) {
  const str = stripAnsi(line);
  return !str.replace(NEWLINE_EXP, '').length;
}

/**
 * Helper to colorize strings with ansi colors.
 * 
 * @see https://www.npmjs.com/package/ansi-styles
 * 
 * @param str the string to be colorize.
 * @param styles the ansi color styles to be applied.
 */
function colorize(str: string, ...styles: Color[]) {
  return styles.reduce((result, color) => {
    if (!colors[color])
      return result;
    return colors[color](result);
  }, str);
}

/**
 * Gets the longest string in an array of strings.
 * 
 * @param values the values to calculate length for.
 */
function getLongest(values: string[], strip = false) {
  return values.reduce((a, c) => {
    if (!c) return a;
    if (strip) {
      c = stripAnsi(c);
      c = c.replace(NEWLINE_EXP, '');
    }
    if (c.length > a)
      return c.length;
    return a;
  }, 0);
}

/**
 * Pads a string left or right.
 * 
 * @param str the string to be padded.
 * @param dir the direction left or right.
 * @param spaces the amount of padding to apply.
 */
function pad(str: string, dir: 'left' | 'right', spaces = 0) {
  if (dir === 'left')
    return ' '.repeat(spaces) + str;
  return str + ' '.repeat(spaces);
}

/**
 * Truncates a string.
 * 
 * @param str the string to be inspected or truncated.
 * @param max the maximum length permissible.
 * @param char the trailing char when exceeds length.
 */
function truncate(str: string, max = 0, char = '...') {
  if (!max || !str)
    return str;
  if (str.length <= max)
    return str;
  return str.substr(0, max - char.length) + char;
}

/**
 * Indents a string.
 * 
 * @param str the string to be indented.
 * @param len the times to repeat the indent.
 * @param char the char to use as indent (default: ' ')
 */
function indent(str: string, len = 1, char = ' ') {
  if (!str || typeof str !== 'string')
    return str;
  len = len || 0;
  // /^(?!\s*$)/gm;
  const exp = /^/gm;
  return str.replace(exp, char.repeat(len));
}

/**
 * Iterates an array of strings, finds longest and calculates
 * the padding needed for each string if required.
 * 
 * @param values the values to inspect for pad length.
 * @param buffer a buffer to add to the length, basically a little spacing.
 * @param strip whether to strip ansi styles first, likely what you want.
 * @returns 
 */
function padInspect(values: string[], buffer = 2, strip = true): [string, number][] {
  const longest = getLongest(values, strip);
  buffer = buffer || 0;
  return values.map(str => {
    const stripped = stripAnsi(str);
    const adj = longest - stripped.length;
    return [str, buffer ? adj + buffer : adj];
  });
}

/**
 * Gets a random position from the collection.
 * 
 * @param collection the collection to get random position for.
 * @param asValue when true should return the position and not the value.
 */
function getRandomValue<T = any>(collection: T[], asPosition: true): number;

/**
 * Gets a random value from the collection.
 * 
 * @param collection the collection to get random value for.
 */
function getRandomValue<T = any>(collection: T[]): T;
function getRandomValue<T = any>(collection: T[], asPosition?: true) {
  const random = Math.floor(Math.random() * collection.length);
  if (asPosition)
    return random;
  return collection[random];
}

/**
 * Gets random positions from collection.
 * 
 * @param collection the collection to get positions for.
 * @param count the number of elements in the permutation.
 * @param asPosition when true gets positions.
 */
function getRandomValues<T = any>(collection: T[], count: number, asPosition: true): number[];
/**
 * Gets random positions from collection.
 * 
 * @param collection the collection to get positions for.
 * @param asPosition when true gets positions.
 */
function getRandomValues<T = any>(collection: T[], asPosition: true): number[];

/**
 * Gets random values from collection.
 * 
 * @param collection the collection to get values for.
 * @param count the number of elements in the permutation.
 */
function getRandomValues<T = any>(collection: T[], count?: number): T[];
function getRandomValues<T = any>(collection: T[], count?: number | true, asPosition?: true) {
  if (typeof count === 'boolean') {
    asPosition = count;
    count = undefined;
  }
  const len = collection.length;
  const found = [] as (number | T)[];
  let ctr = 0;
  count = count || len;

  function run(unused: T[]) {
    ctr += 1;
    while (found.length < count && ctr < len) {
      const random = getRandomValue(collection, asPosition);
      if (!found.includes(random)) {
        found.push(random)
        unused = unused.filter(v => v !== random as any);
      }
    }
  }
  run([...collection]);
  return found;
}

/**
 * Simple tranform to prefix with timestamp then ouput original line.
 * 
 * @param line the line to be transformed.
 */
function defaultWriteHandler(line: string) {
  console.log(chomp(line));
}

/**
 * Writes lines to terminal/console.
 * 
 * @param readable the readable stream to be output.
 * @param transform optiona transform function for output.
 */
export async function writeLines(readable, transform = defaultWriteHandler) {
  for await (const line of chunksToLines(readable)) { // (C)
    let str = line;
    if (Buffer.isBuffer(str))
      str = str.toString('utf8');
    str = chomp(str);
    transform(str);
  }
}


function exceptionHandler(err: Error) {
  process.stderr.write(redBright(err.stack || err.message || err + '\n'));
};

/**
 * Helper to enable catching uncaught & unhandled exceptions.
 * 
 * @param handler optional exception handler.
 */
function registerExceptions(handler = exceptionHandler) {
  const uncaught = registerEvent('uncaughtException', handler);
  const rejected = registerEvent('unhandledRejection', exceptionHandler);
  return () => {
    uncaught();
    rejected();
  };
}

function registerEvent(signalOrEvent: string | symbol, handler: (...args) => void) {
  process.on(signalOrEvent as any, handler);
  return () => {
    process.off(signalOrEvent, handler);
  }
}

export default {
  symbols,
  registerEvent,
  registerExceptions,
  writeLines,
  defaultWriteHandler,
  pad,
  padInspect,
  getLongest,
  getRandomValue,
  getRandomValues,
  indent,
  truncate,
  colorize,
  isBlankLine,
  wrapAnsi,
  stripAnsi,
  stripEmoji,
  chunksToLines,
  chomp,
  pinger
};

// const stripped = strip(str);
// return str + ' '.repeat(max - stripped.length);

