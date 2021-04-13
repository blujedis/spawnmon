
import { Spawnmon } from '../spawnmon';
import cli from './api';

function init() {

  if (cli.hasHelp())
    return cli.show.help();

  if (!cli.hasCommands() && cli.hasFlag(cli.firstArg)) {
    cli.show.logo('both');
    cli.show.message(`No spawn commands present, did you mean to run:`, null, 'bottom');
    return cli.show.message(`spawnmon ${cli.argv[0]} -h?`, 'yellow', 'bottom');
  }

  // If we get here, time to run commands.
  cli.run();

}

init();



