import colors from 'ansi-colors';
import strip from 'strip-ansi';
import { Color } from './types';

export const NEWLINE_EXP = /\r?\n$/u;

/**
 * Detects line returns if match slices,
 * run before transform to retain consistent
 * line returns.
 * 
 * @param line the line to be cleaned up.
 */
export function chomp(line) {
  const match = NEWLINE_EXP.exec(line);
  if (!match) return line;
  return line.slice(0, match.index);
}

/**
 * Helper to colorize strings with ansi colors.
 * 
 * @see https://www.npmjs.com/package/ansi-styles
 * 
 * @param str the string to be colorize.
 * @param styles the ansi color styles to be applied.
 */
export function colorize(str: string, ...styles: Color[]) {
  return styles.reduce((result, color) => {
    if (!colors[color])
      return result;
    return colors[color](result);
  }, str);
}

/**
 * Checks if line is a blank line after stripping any ansi styles or line returns.
 * 
 * @param line the line to be inspected.
 */
export function isBlankLine(line: string) {
  const str = stripAnsi(line);
  return !str.replace(NEWLINE_EXP, '').length;
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
 * Escapes a regexp string.
 * 
 * @param str the string to escape.
 */
export function escapeRegex(str: string) {
  return str
    .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
    .replace(/-/g, '\\x2d');
}

/**
 * Pads a string left or right.
 * 
 * @param str the string to be padded.
 * @param dir the direction left or right.
 * @param spaces the amount of padding to apply.
 */
export function pad(str: string, dir: 'left' | 'right', spaces = 0) {
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
export function truncate(str: string, max = 0, char = '...') {
  if (!max || !str)
    return str;
  if (str.length <= max)
    return str;
  return str.substr(0, max - char.length) + char;
}
