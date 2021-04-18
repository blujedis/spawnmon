import { ICommandOptions, ISpawnmonOptions } from '../types';
declare const logo: string;
declare const pkg: any;
declare const appPkg: any;
declare let globalOptions: ISpawnmonOptions & ICommandOptions & {
    commands: any;
};
export { pkg, appPkg, logo, globalOptions };
