import { HelpKey } from './help';
import { StyleFunction } from 'ansi-colors';
declare type PaddingKey = 'top' | 'bottom' | 'both' | 'none';
export declare function initApi(argv: any[]): {
    argv: any[];
    config: {
        commands: import("..").ICommandOptions[];
        children: string[];
        options: import("..").ISpawnmonOptions;
    };
    hasFlags: () => boolean;
    hasCommands: () => boolean;
    hasCommand: (...command: string[]) => boolean;
    hasFlag: (...flag: string[]) => boolean;
    hasHelp: () => boolean;
    hasHelpArg: (key?: string) => boolean;
    firstArg: string;
    run: () => void;
    show: {
        logo: (padding?: PaddingKey) => void;
        header: (usage?: boolean, padding?: boolean) => void;
        section: (label: string, color?: keyof StyleFunction | string, padding?: PaddingKey, indent?: string) => void;
        groups: (color?: keyof StyleFunction | string) => void;
        item: (key: HelpKey, color?: string) => void;
        examples: (color?: keyof StyleFunction | string) => void;
        pad: (count?: number) => void;
        message: (msg: string, color?: string, padding?: PaddingKey) => void;
        help: (key?: string) => void;
    };
};
declare const _default: {
    argv: any[];
    config: {
        commands: import("..").ICommandOptions[];
        children: string[];
        options: import("..").ISpawnmonOptions;
    };
    hasFlags: () => boolean;
    hasCommands: () => boolean;
    hasCommand: (...command: string[]) => boolean;
    hasFlag: (...flag: string[]) => boolean;
    hasHelp: () => boolean;
    hasHelpArg: (key?: string) => boolean;
    firstArg: string;
    run: () => void;
    show: {
        logo: (padding?: PaddingKey) => void;
        header: (usage?: boolean, padding?: boolean) => void;
        section: (label: string, color?: string, padding?: PaddingKey, indent?: string) => void;
        groups: (color?: string) => void;
        item: (key: "templates" | "raw" | "maxProcesses" | "prefixAlign" | "defaultColor" | "condensed" | "prefix" | "prefixFill" | "prefixMax" | "labels" | "version" | "colors" | "delay" | "mute" | "onTimer" | "onPinger", color?: string) => void;
        examples: (color?: string) => void;
        pad: (count?: number) => void;
        message: (msg: string, color?: string, padding?: PaddingKey) => void;
        help: (key?: string) => void;
    };
};
export default _default;
