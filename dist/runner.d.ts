/// <reference types="node" />
import { ChildProcess, SpawnSyncReturns } from 'child_process';
import { ApiFor, CommandTuple, SpawnOptionsExt, TransformHandler } from './types';
export declare type ApiBase = ReturnType<typeof createRunner>;
export declare function createRunner(defaultTransform?: TransformHandler | SpawnOptionsExt, defaultSpawnOptions?: {
    writestream?: "stdout" | "stderr";
    argv0?: string;
    stdio?: import("child_process").StdioOptions;
    detached?: boolean;
    shell?: string | boolean;
    windowsVerbatimArguments?: boolean;
    windowsHide?: boolean;
    timeout?: number;
    uid?: number;
    gid?: number;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
}): {
    readonly processes: (ChildProcess | SpawnSyncReturns<Buffer>)[];
    readonly commands: CommandTuple[];
    toTuple: (cmd: string, args: any[] | SpawnOptionsExt | TransformHandler, opts: SpawnOptionsExt | TransformHandler, transform: TransformHandler) => CommandTuple;
    add: (cmd: string, args?: any[] | SpawnOptionsExt | TransformHandler, opts?: SpawnOptionsExt | TransformHandler, transform?: TransformHandler) => ApiFor;
    run: (initCmd: string, argsOptsOrHandler?: any[] | SpawnOptionsExt | TransformHandler, optsOrHandler?: SpawnOptionsExt | TransformHandler, initTransform?: TransformHandler) => ChildProcess;
    runAll: (confs?: CommandTuple[]) => any;
    kill: (...pids: number[]) => void;
    reset: (all?: boolean) => any;
    utils: {
        symbols: {
            alert: string;
            caution: string;
            notice: string;
            success: string;
        };
        registerEvent: (signalOrEvent: string | symbol, handler: (...args: any[]) => void) => () => void;
        registerExceptions: (handler?: (err: Error) => void) => () => void;
        writeLines: typeof import("./utils").writeLines;
        defaultWriteHandler: (line: string) => void;
        pad: (str: string, dir: "left" | "right", spaces?: number) => string;
        padInspect: (values: string[], buffer?: number, strip?: boolean) => [string, number][];
        getLongest: (values: string[], strip?: boolean) => number;
        getRandomValue: {
            <T = any>(collection: T[], asPosition: true): number;
            <T_1 = any>(collection: T_1[]): T_1;
        };
        getRandomValues: {
            <T_2 = any>(collection: T_2[], count: number, asPosition: true): number[];
            <T_3 = any>(collection: T_3[], asPosition: true): number[];
            <T_4 = any>(collection: T_4[], count?: number): T_4[];
        };
        indent: (str: string, len?: number, char?: string) => string;
        truncate: (str: string, max?: number, char?: string) => string;
        colorize: (str: string, ...styles: (keyof import("ansi-colors").StylesType<import("ansi-colors").StyleFunction>)[]) => string;
        isBlankLine: (line: string) => boolean;
        wrapAnsi: (line: string, columns: number, options: {
            hard?: boolean;
            trim?: boolean;
            wordWrap?: boolean;
        }) => string;
        stripAnsi: (line: string) => string;
        stripEmoji: (str: string) => string;
        chunksToLines: typeof import("./utils").chunksToLines;
        chomp: (line: any) => any;
        pinger: typeof import("./pinger").default;
    };
};
declare const _default: {
    readonly processes: (ChildProcess | SpawnSyncReturns<Buffer>)[];
    readonly commands: CommandTuple[];
    toTuple: (cmd: string, args: any[] | TransformHandler | SpawnOptionsExt, opts: TransformHandler | SpawnOptionsExt, transform: TransformHandler) => CommandTuple;
    add: (cmd: string, args?: any[] | TransformHandler | SpawnOptionsExt, opts?: TransformHandler | SpawnOptionsExt, transform?: TransformHandler) => ApiFor;
    run: (initCmd: string, argsOptsOrHandler?: any[] | TransformHandler | SpawnOptionsExt, optsOrHandler?: TransformHandler | SpawnOptionsExt, initTransform?: TransformHandler) => ChildProcess;
    runAll: (confs?: CommandTuple[]) => any;
    kill: (...pids: number[]) => void;
    reset: (all?: boolean) => any;
    utils: {
        symbols: {
            alert: string;
            caution: string;
            notice: string;
            success: string;
        };
        registerEvent: (signalOrEvent: string | symbol, handler: (...args: any[]) => void) => () => void;
        registerExceptions: (handler?: (err: Error) => void) => () => void;
        writeLines: typeof import("./utils").writeLines;
        defaultWriteHandler: (line: string) => void;
        pad: (str: string, dir: "left" | "right", spaces?: number) => string;
        padInspect: (values: string[], buffer?: number, strip?: boolean) => [string, number][];
        getLongest: (values: string[], strip?: boolean) => number;
        getRandomValue: {
            <T = any>(collection: T[], asPosition: true): number;
            <T_1 = any>(collection: T_1[]): T_1;
        };
        getRandomValues: {
            <T_2 = any>(collection: T_2[], count: number, asPosition: true): number[];
            <T_3 = any>(collection: T_3[], asPosition: true): number[];
            <T_4 = any>(collection: T_4[], count?: number): T_4[];
        };
        indent: (str: string, len?: number, char?: string) => string;
        truncate: (str: string, max?: number, char?: string) => string;
        colorize: (str: string, ...styles: (keyof import("ansi-colors").StylesType<import("ansi-colors").StyleFunction>)[]) => string;
        isBlankLine: (line: string) => boolean;
        wrapAnsi: (line: string, columns: number, options: {
            hard?: boolean;
            trim?: boolean;
            wordWrap?: boolean;
        }) => string;
        stripAnsi: (line: string) => string;
        stripEmoji: (str: string) => string;
        chunksToLines: typeof import("./utils").chunksToLines;
        chomp: (line: any) => any;
        pinger: typeof import("./pinger").default;
    };
};
export default _default;
