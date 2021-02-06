import { parse } from "../../deps.ts";
import { NestCLIError } from "../../utils/error.ts";
import { aliasesFromOptions } from "../../utils/cli.ts";
import { setupCheckType } from "../../processing/check_type.ts";
import { shift } from "../../utils/array.ts";
import { didYouMean } from "../../utils/cli.ts";
import { mainCommand, mainOptions } from "../main.ts";

import type { Args, Command } from "../../utils/types.ts";

interface Flags {
  command?: string;
}

export const configCommand: Command = {
  name: "config",
  description: "",
  options: mainOptions,
  arguments: [{
    name: "[command]",
    description: "A command to run.",
  }],
  subCommands: new Map(),
  action,
};

mainCommand.subCommands.set(configCommand.name, configCommand);

export async function action(args = Deno.args) {
  const { command } = assertFlags(parse(
    args,
    { alias: aliasesFromOptions(mainOptions) },
  ));

  await config(command);
}

function assertFlags(args: Args): Flags {
  const { _: [command] } = args;

  const { checkType, typeError } = setupCheckType("flags");

  checkType("[command]", command, ["string"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { command } as Flags;
}

// **************** logic ****************

/** Command handler */
async function config(command?: string) {
  if (command) {
    const subCommands = configCommand.subCommands;
    if (subCommands.has(command)) {
      await subCommands.get(command)!.action(shift(Deno.args));
    } else {
      didYouMean([...subCommands.keys()], [command]);
      throw new NestCLIError("Unknown command");
    }
  } else {
    // default action
  }
}
