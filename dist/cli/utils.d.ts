import yargsParser, { Arguments, Configuration } from 'yargs-parser';
import { StyleFunction } from 'ansi-colors';
import { HelpConfigs } from './help';
import { ICommandOptions, ISpawnmonOptions } from '../types';
export declare type Case = 'upper' | 'lower' | 'cap' | 'dash' | 'snake' | 'title' | 'dot' | 'camel';
export declare type ToArrayType = string | boolean | number;
export interface IParseCommandOptions {
    as: string[];
    colors: string[];
    delay: number[];
    mute: string[];
    onTimer: {
        name: string;
        target: string;
        interval?: number;
    }[];
    onPinger: {
        name: string;
        target: string;
        host?: string;
        port?: number;
    }[];
}
/**
 * Converts help config objects to Yargs Parser config objects.
 *
 * @param helpItems the configuration object to be converted.
 */
export declare function toYargsOptions(helpItems: HelpConfigs, configuration?: Partial<Configuration>): {
    options: {
        string: any[];
        boolean: any[];
        number: any[];
        array: any[];
        default: any;
        alias: any;
        coerce: any;
        configuration: Partial<yargsParser.Configuration>;
    };
    aliases: any[];
};
/**
 * Builds commands into configuration for Spawnmon.
 *
 * @param commands takes string commands to parse.
 * @param as optional as or labels to run commands "as".
 */
export declare function toCommands(commands: string[], options?: IParseCommandOptions): {
    commands: {
        command: string;
        args: RegExpMatchArray;
        as: string;
        color: string;
        delay: number;
        mute: boolean;
        timer: any;
        pinger: any;
    }[];
    children: any[];
};
/**
 * Parses commands and destructures options into
 * Spawnmon commands and options.
 *
 * @param parsed the minimist parsed arguments.
 */
export declare function toConfig(parsed: Arguments): {
    commands: ICommandOptions[];
    children: string[];
    options: ISpawnmonOptions;
};
/**
 * Removes unnecessary keys.
 *
 * @param keys the keys to filter/remove.
 * @param options the object to be filtered.
 */
export declare function filterOptions(keys: string[], options: Record<string, any>): {
    [x: string]: any;
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
export declare function toArray<T = string>(value: any, def?: any[]): T[];
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
/**
 * Removes either -- or - from value.
 *
 * @param value the value to unflag
 */
export declare function unflag(value: string): string;
export declare function createError(errOrMessage: string | Error): Error;
