import { parse } from "../deps.ts";
import { limitArgs, limitOptions, setupCheckType } from "../utilities/cli.ts";
import { NestCLIError } from "../error.ts";
import { mainOptions } from "./main/options.ts";
import { logout } from "../functions/logout.ts";

import type { Command, Args } from "../utilities/types.ts";

export const logoutCommand: Command = {
  name: "logout",
  description: "Remove an existing user account",
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

  await logout(user);
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
