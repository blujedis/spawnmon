"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = __importDefault(require("./api"));
function init() {
    if (api_1.default.hasHelp())
        return api_1.default.show.help();
    if (!api_1.default.hasCommands() && api_1.default.hasFlag(api_1.default.firstArg)) {
        api_1.default.show.logo('both');
        api_1.default.show.message(`No spawn commands present, did you mean to run:`, null, 'bottom');
        return api_1.default.show.message(`spawnmon ${api_1.default.argv[0]} -h?`, 'yellow', 'bottom');
    }
    // If we get here, time to run commands.
    api_1.default.run();
}
init();
//# sourceMappingURL=index.js.map