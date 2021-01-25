import { parse } from "../deps.ts";
import type { Args } from "../deps.ts";
import { limitArgs, limitOptions, setupCheckType } from "../utilities/cli.ts";
import { NestCLIError } from "../error.ts";
import type { Command } from "../utilities/types.ts";

import { mainOptions } from "./main/options.ts";

import { setup } from "../functions/setup.ts";

export const setupCommand: Command = {
  name: "setup",
  description: "Link current directory to an existing module.",
  arguments: [{
    name: "[author]",
    description: "",
  }, {
    name: "[module]",
    description: "",
  }],
  options: mainOptions,
  subCommands: {},
  action,
};

export async function action(args = Deno.args) {
  const { author, name } = assertFlags(parse(args));

  await setup(author, name);
}

interface Flags {
  author?: string;
  name?: string;
}

function assertFlags(args: Args): Flags {
  const { _: [_, author, name, ...remainingArgs], ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("[author]", author, ["string"]);
  checkType("[module]", name, ["string"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { author, name } as Flags;
}
