import { Color } from './types';
export declare const NEWLINE_EXP: RegExp;
/**
 * Detects line returns if match slices,
 * run before transform to retain consistent
 * line returns.
 *
 * @param line the line to be cleaned up.
 */
export declare function chomp(line: any): any;
/**
 * Helper to colorize strings with ansi colors.
 *
 * @see https://www.npmjs.com/package/ansi-styles
 *
 * @param str the string to be colorize.
 * @param styles the ansi color styles to be applied.
 */
export declare function colorize(str: string, ...styles: Color[]): string;
/**
 * Checks if line is a blank line after stripping any ansi styles or line returns.
 *
 * @param line the line to be inspected.
 */
export declare function isBlankLine(line: string): boolean;
/**
 * Escapes a regexp string.
 *
 * @param str the string to escape.
 */
export declare function escapeRegex(str: string): string;
/**
 * Pads a string left or right.
 *
 * @param str the string to be padded.
 * @param dir the direction left or right.
 * @param spaces the amount of padding to apply.
 */
export declare function pad(str: string, dir: 'left' | 'right', spaces?: number): string;
/**
 * Truncates a string.
 *
 * @param str the string to be inspected or truncated.
 * @param max the maximum length permissible.
 * @param char the trailing char when exceeds length.
 */
export declare function truncate(str: string, max?: number, char?: string): string;
/**
 * Simple method to clone a class.
 *
 * @param instance the class instance you wish to clone.
 */
export declare function cloneClass<T>(instance: T): any;
