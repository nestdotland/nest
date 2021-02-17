import { cyan, parse } from "../../deps.ts";
import { NestCLIError } from "../../utils/error.ts";
import { aliasesFromOptions, CommandMap } from "../../utils/cli.ts";
import { setupCheckType } from "../../processing/check_type.ts";
import { shift } from "../../utils/array.ts";
import { log } from "../../utils/log.ts";
import { didYouMean } from "../../utils/cli.ts";
import { mainCommand } from "../main.ts";

import type { Args, Command } from "../../utils/types.ts";

interface Flags {
  command?: string;
}

export const configCommand: Command = {
  name: "config",
  description: "Offers finer control over configuration than sync command",
  options: mainCommand.options,
  arguments: [{
    name: "[subcommand]",
    description: `A command to run, ${cyan("status")} by default.`,
  }],
  subCommands: new CommandMap(),
  action,
};

export async function action(args = Deno.args) {
  const { command } = assertFlags(parse(
    args,
    { alias: aliasesFromOptions(configCommand.options) },
  ));

  await config(args, command);
}

function assertFlags(args: Args): Flags {
  const { _: [command] } = args;

  const { checkType, typeError } = setupCheckType("flags");

  checkType("[subcommand]", command, ["string"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { command } as Flags;
}

// **************** logic ****************

/** Command handler */
async function config(args: string[], command?: string) {
  if (command) {
    const subCommands = configCommand.subCommands;
    if (subCommands.has(command)) {
      await subCommands.get(command)!.action(shift(args));
    } else {
      didYouMean([...subCommands.keys()], [command]);
      throw new NestCLIError("Unknown command");
    }
  } else {
    // default action
    const statusCommand = configCommand.subCommands.get("status");
    if (statusCommand === undefined) {
      log.error("No status command registered.");
      throw new NestCLIError("No status command registered (config)");
    }
    await statusCommand.action(shift(args));
  }
}
