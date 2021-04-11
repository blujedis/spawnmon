import { ParsedArgs } from 'minimist';
import { StyleFunction } from 'ansi-colors';
import { ICommandOptions, ISpawnmonOptions } from '../types';
export declare type Case = 'upper' | 'lower' | 'cap' | 'dash' | 'snake' | 'title' | 'dot' | 'camel';
/**
 * Normalizes, bascially some clean up after minimist parses arguments.
 *
 * @param parsed the parsed arguments.
 */
export declare function toNormalized(parsed: ParsedArgs): Omit<ParsedArgs, "--">;
/**
 * Builds commands into configuration for Spawnmon.
 *
 * @param commands takes string commands to parse.
 * @param as optional as or labels to run commands "as".
 */
export declare function toCommands(commands: string[], as?: string[]): {
    command: string;
    args: string[];
    index: number;
    as: string;
}[];
/**
 * Parses commands and destructures options into
 * Spawnmon commands and options.
 *
 * @param parsed the minimist parsed arguments.
 */
export declare function toConfig(parsed: ParsedArgs): {
    commands: ICommandOptions[];
    options: ISpawnmonOptions;
};
/**
 * Colorizes a string.
 *
 * @param str the string to be stylized.
 * @param style a style or dot notation string of styles.
 * @param styles rest param of styles.
 */
export declare function stylizer(str: string, style: string | keyof StyleFunction, ...styles: (keyof StyleFunction)[]): string;
/**
 * Ensures value is an array.
 *
 * @param value the value to ensure as array.
 * @param def the default value if undefined or null.
 */
export declare function toArray(value: any, def?: any[]): any[];
export declare function changeCase(str: string, casing: Case, preTrim?: boolean): any;
/**
 * Formats string matching template expression replacing with key values in object.
 *
 * @param str the string to be formated.
 * @param obj the object to use for mapping values.
 */
export declare function simpleFormatter<R extends Record<string, string>>(str: string, obj: R, exp?: RegExp): string;
/**
 * Formats strings matching template expression replacing with key values in object.
 *
 * @param str the string to be formated.
 * @param obj the object to use for mapping values.
 */
export declare function simpleFormatter<R extends Record<string, string>>(str: string[], obj: R, exp?: RegExp): string[];
/**
 * Converts a property to a cli flag.
 *
 * @param values the values to convert to flags.
 */
export declare function toFlag(value: string): string;
/**
 * Converts a properties to a cli flags.
 *
 * @param values the values to convert to flags.
 */
export declare function toFlag(...values: string[]): string[];
