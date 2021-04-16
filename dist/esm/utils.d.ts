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
export declare function colorize(str: string, ...styles: Color[]): any;
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
/**
 * Just creates a styled error message.
 *
 * @param err the error message or Error instance.
 */
export declare function createError(err: string | (Error & Record<string, any>)): Error & Record<string, any>;
/**
 * Timestamp only supports long format e.g. 'YYYY.MM.DD HH:mm:ss'
 * If you need more advanced formatting pass in "onTimestamp"
 * handler in Spawnmon options.
 *
 * @param format the format to be used.
 * @param date the date to create timestamp for.
 */
export declare function simpleTimestamp(date?: Date, timeOnly?: boolean): string;
/**
 * Ensures an options object contains correct default values.
 *
 * @param options the options object to ensure defaults for.
 * @param defaults the default values.
 */
export declare function ensureDefaults<T>(options: T, defaults: Partial<T>): T;
