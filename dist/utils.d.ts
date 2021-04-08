import { Color, IMonitorOptions } from './types';
export declare type SimpleTimer = ReturnType<typeof createTimer>;
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
 * Simple timer monitor that watches update counts. Once
 * the counter goes stale and remains the same between
 * ticks of the "interval" we know then the stream is likely idle.
 *
 *
 * @param options define interval, done callback and callback to check if should exit.
 */
export declare function createTimer(options?: IMonitorOptions): {
    readonly running: boolean;
    update: () => void;
    start: () => void;
    stop: () => void;
};
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
