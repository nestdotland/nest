import { parse } from "../deps.ts";
import { limitArgs, limitOptions, setupCheckType } from "../utilities/cli.ts";
import { NestCLIError } from "../error.ts";
import { mainOptions } from "./main/options.ts";
import { switchUser } from "../functions/switch.ts";

import type { Args, Command } from "../utilities/types.ts";

export const switchCommand: Command = {
  name: "switch",
  description: "Change currently logged in user.",
  arguments: [{
    name: "[username]",
    description: "",
  }],
  options: mainOptions,
  subCommands: {},
  action,
};

export async function action(args = Deno.args) {
  const { user } = assertFlags(parse(args));

  await switchUser(user);
}

interface Flags {
  user?: string;
}

function assertFlags(args: Args): Flags {
  const { _: [_, user, ...remainingArgs], ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("[username]", user, ["string"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { user } as Flags;
}
