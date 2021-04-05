import { Color } from './types';
import stringLength from 'string-length';
import stringWidth from 'string-width';
import pinger from './pinger';
export { stringLength, stringWidth };
/**
 * Detects line returns if match slices.
 *
 * @param line the line to be cleaned up.
 */
declare function chomp(line: any): any;
/**
 * Converts chunks into output lines for terminal/console.
 *
 * @param chunks the chunks to convert to lines.
 */
export declare function chunksToLines(chunks: any): AsyncGenerator<string, void, unknown>;
/**
 * Removes emojis from string.
 *
 * @param str the string containing emojis.
 */
declare function stripEmoji(str: string): string;
/**
 * Strips line of ansi styles.
 *
 * @see https://www.npmjs.com/package/strip-ansi
 *
 * @param line the line to be stripped.
 */
declare function stripAnsi(line: string): string;
/**
 * Wraps a line to the defined parameters.
 *
 * @see https://www.npmjs.com/package/wrap-ansi
 *
 * @param line the line to be wrapped or constrained as defined.
 * @param columns the number of columns to wrap to.
 * @param options the options for wrapping the line.
 */
declare function wrapAnsi(line: string, columns: number, options: {
    hard?: boolean;
    trim?: boolean;
    wordWrap?: boolean;
}): string;
/**
 * Checks if line is a blank line after stripping any ansi styles or line returns.
 *
 * @param line the line to be inspected.
 */
declare function isBlankLine(line: string): boolean;
/**
 * Helper to colorize strings with ansi colors.
 *
 * @see https://www.npmjs.com/package/ansi-styles
 *
 * @param str the string to be colorize.
 * @param styles the ansi color styles to be applied.
 */
declare function colorize(str: string, ...styles: Color[]): string;
/**
 * Gets the longest string in an array of strings.
 *
 * @param values the values to calculate length for.
 */
declare function getLongest(values: string[], strip?: boolean): number;
/**
 * Pads a string left or right.
 *
 * @param str the string to be padded.
 * @param dir the direction left or right.
 * @param spaces the amount of padding to apply.
 */
declare function pad(str: string, dir: 'left' | 'right', spaces?: number): string;
/**
 * Truncates a string.
 *
 * @param str the string to be inspected or truncated.
 * @param max the maximum length permissible.
 * @param char the trailing char when exceeds length.
 */
declare function truncate(str: string, max?: number, char?: string): string;
/**
 * Indents a string.
 *
 * @param str the string to be indented.
 * @param len the times to repeat the indent.
 * @param char the char to use as indent (default: ' ')
 */
declare function indent(str: string, len?: number, char?: string): string;
/**
 * Iterates an array of strings, finds longest and calculates
 * the padding needed for each string if required.
 *
 * @param values the values to inspect for pad length.
 * @param buffer a buffer to add to the length, basically a little spacing.
 * @param strip whether to strip ansi styles first, likely what you want.
 * @returns
 */
declare function padInspect(values: string[], buffer?: number, strip?: boolean): [string, number][];
/**
 * Gets a random position from the collection.
 *
 * @param collection the collection to get random position for.
 * @param asValue when true should return the position and not the value.
 */
declare function getRandomValue<T = any>(collection: T[], asPosition: true): number;
/**
 * Gets a random value from the collection.
 *
 * @param collection the collection to get random value for.
 */
declare function getRandomValue<T = any>(collection: T[]): T;
/**
 * Gets random positions from collection.
 *
 * @param collection the collection to get positions for.
 * @param count the number of elements in the permutation.
 * @param asPosition when true gets positions.
 */
declare function getRandomValues<T = any>(collection: T[], count: number, asPosition: true): number[];
/**
 * Gets random positions from collection.
 *
 * @param collection the collection to get positions for.
 * @param asPosition when true gets positions.
 */
declare function getRandomValues<T = any>(collection: T[], asPosition: true): number[];
/**
 * Gets random values from collection.
 *
 * @param collection the collection to get values for.
 * @param count the number of elements in the permutation.
 */
declare function getRandomValues<T = any>(collection: T[], count?: number): T[];
/**
 * Simple tranform to prefix with timestamp then ouput original line.
 *
 * @param line the line to be transformed.
 */
declare function defaultWriteHandler(line: string): void;
/**
 * Writes lines to terminal/console.
 *
 * @param readable the readable stream to be output.
 * @param transform optiona transform function for output.
 */
export declare function writeLines(readable: any, transform?: typeof defaultWriteHandler): Promise<void>;
declare function exceptionHandler(err: Error): void;
/**
 * Helper to enable catching uncaught & unhandled exceptions.
 *
 * @param handler optional exception handler.
 */
declare function registerExceptions(handler?: typeof exceptionHandler): () => void;
declare function registerEvent(signalOrEvent: string | symbol, handler: (...args: any[]) => void): () => void;
declare const _default: {
    symbols: {
        alert: string;
        caution: string;
        notice: string;
        success: string;
    };
    registerEvent: typeof registerEvent;
    registerExceptions: typeof registerExceptions;
    writeLines: typeof writeLines;
    defaultWriteHandler: typeof defaultWriteHandler;
    pad: typeof pad;
    padInspect: typeof padInspect;
    getLongest: typeof getLongest;
    getRandomValue: typeof getRandomValue;
    getRandomValues: typeof getRandomValues;
    indent: typeof indent;
    truncate: typeof truncate;
    colorize: typeof colorize;
    isBlankLine: typeof isBlankLine;
    wrapAnsi: typeof wrapAnsi;
    stripAnsi: typeof stripAnsi;
    stripEmoji: typeof stripEmoji;
    chunksToLines: typeof chunksToLines;
    chomp: typeof chomp;
    pinger: typeof pinger;
};
export default _default;
