import { parse } from "../deps.ts";
import type { Args } from "../deps.ts";
import { NestCLIError } from "../error.ts";
import { limitArgs, limitOptions, setupCheckType } from "../utilities/cli.ts";
import type { Command } from "../utilities/types.ts";

import { mainOptions } from "./main/options.ts";

import { upgrade } from "../functions/upgrade.ts";

export const upgradeCommand: Command = {
  name: "upgrade",
  description: "Upgrade nest cli to the given version",
  arguments: [{
    name: "[version]",
    description: "A given version, the latest by default",
  }],
  options: mainOptions,
  subCommands: {},
  action,
};

export async function action(args = Deno.args) {
  const { version } = assertFlags(parse(args));

  await upgrade(version);
}

interface Flags {
  version?: string;
}

function assertFlags(args: Args): Flags {
  const { _: [_, version, ...remainingArgs], ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("[version]", version, ["string", "number"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { version: `${version}` } as Flags;
}
