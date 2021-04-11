import { ParsedArgs } from 'minimist';
import { HelpKey } from './help';
export declare function initApi(parsed: ParsedArgs): {
    config: {
        commands: import("..").ICommandOptions[];
        options: import("..").ISpawnmonOptions;
    };
    hasCommand: (...command: string[]) => boolean;
    hasFlag: (...flag: string[]) => boolean;
    run: () => void;
    showHelp: (key?: HelpKey | 'examples') => void;
};
