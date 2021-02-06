import { cyan, parse } from "../deps.ts";
import {
  handleError,
  lineBreak,
  log,
  setupLogLevel,
  writeLogFile,
} from "../utils/log.ts";
import { NestCLIError, NestError } from "../utils/error.ts";
import { aliasesFromOptions } from "../utils/cli.ts";
import { version as currentVersion } from "../../version.ts";
import { setupCheckType } from "../processing/check_type.ts";
import { shift } from "../utils/array.ts";
import { didYouMean } from "../utils/cli.ts";

import type { Args, Command, Option } from "../utils/types.ts";

interface Flags {
  command?: string;
  logLevel?: string;
  logFile?: string;
  version?: boolean;
  help: unknown;
  gui?: boolean;
}

export const mainOptions: Option[] = [
  {
    flag: "-h, --help",
    description: "Show this help",
  },
  {
    flag: "-V, --version",
    description: "Display version number",
  },
  {
    flag: "-L, --log-level",
    argument: "<level>",
    description: `Set log level, ${cyan("info")} by default`,
  },
  {
    flag: "-l, --log",
    argument: "<path>",
    description: `Specify filepath to output logs, ${
      cyan("nest-debug.log")
    } by default`,
  },
  {
    flag: "-G, --gui",
    description: "Perform the task in the gui (not implemented yet)",
  },
];

export const mainCommand: Command = {
  name: "",
  description:
    "nest.land - A module registry and CDN for Deno, on the permaweb",
  options: mainOptions,
  arguments: [{
    name: "[command]",
    description: "A command to run, help by default.",
  }],
  subCommands: new Map(),
  action,
};

export async function action(args = Deno.args) {
  setupLogLevel();

  let logToFile: string | undefined;

  try {
    const flags = assertFlags(parse(
      args,
      { alias: aliasesFromOptions(mainOptions) },
    ));

    logToFile = flags.logFile;

    await main(flags);

    if (flags.logFile) {
      await writeLogFile(logToFile);
    }

    Deno.exit(0);
  } catch (err) {
    if (err instanceof NestCLIError || err instanceof NestError) {
      log.debug(err.stack);
      Deno.exit(1);
    }

    await handleError(err instanceof Error ? err : new Error(err), logToFile);
    Deno.exit(2);
  }
}

function assertFlags(args: Args): Flags {
  const {
    _: [command],
    "log-level": logLevel,
    version,
    help,
    gui,
    log: logFile,
  } = args;

  const { checkType, typeError } = setupCheckType("flags");

  checkType("[command]", command, ["string"]);
  checkType("--log-level", logLevel, ["string"]);
  checkType("--log", logFile, ["string"]);
  checkType("--version", version, ["boolean"]);
  checkType("--gui", gui, ["boolean"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { command, logLevel, version, help, gui, logFile } as Flags;
}

// **************** logic ****************

/** Command handler */
async function main({ command, logLevel, version, help, gui }: Flags) {
  if (version) {
    log.plain(currentVersion);
    return;
  }

  lineBreak();

  if (help) {
    displayHelp();
    return;
  }

  setupLogLevel(logLevel);

  if (gui) {
    log.error("GUI not implemented");
    throw new NestCLIError("GUI not implemented");
  }

  if (command) {
    const subCommands = mainCommand.subCommands;
    if (subCommands.has(command)) {
      await subCommands.get(command)!.action(shift(Deno.args));
    } else {
      didYouMean([...subCommands.keys()], [command]);
      throw new NestCLIError("Unknown command");
    }
  } else {
    // default action
    displayHelp();
  }
}

async function displayHelp(): Promise<void> {
  const helpCommand = mainCommand.subCommands.get("help");
  if (helpCommand === undefined) {
    log.error("No help command registered.");
    throw new NestCLIError("No Help command registered (main)");
  }
  await helpCommand.action(Deno.args);
}
