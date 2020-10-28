import { version as currentVersion } from "./version.ts";
import { globalCommand } from "./commands/global.ts";
import { help as displayHelp } from "./help.ts";
import { log, setupLogLevel } from "./utilities/log.ts";
import { CLIError } from "./error.ts";

export async function global(
  command?: string,
  logLevel?: string,
  version?: boolean,
  help?: boolean,
  gui?: boolean,
) {
  if (version) {
    console.info(currentVersion);
    return;
  }

  if (help) {
    displayHelp(command);
    return;
  }

  setupLogLevel(logLevel);

  if (command) {
    if (command in globalCommand.subCommands) {
      await globalCommand.subCommands[command].action();
    } else {
      log.error(`Unknown command: ${command}`);
      throw new CLIError("Unknown command");
    }
  } else {
    await displayHelp();
  }
}
