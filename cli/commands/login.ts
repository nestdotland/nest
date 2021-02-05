import { parse } from "../deps.ts";
import { limitArgs, limitOptions, setupCheckType } from "../utilities/cli.ts";
import { NestCLIError } from "../error.ts";
import { mainOptions } from "./main/options.ts";
import { mainCommand } from "./main.ts";
import { login } from "../functions/login.ts";

import type { Args, Command } from "../utilities/types.ts";

export const loginCommand: Command = {
  name: "login",
  description: "Add an existing user account",
  arguments: [{
    name: "[username]",
    description: "A username",
  }, {
    name: "[token]",
    description: "A login token",
  }],
  options: mainOptions,
  subCommands: new Map(),
  action,
};

mainCommand.subCommands.set(loginCommand.name, loginCommand);

export async function action(args = Deno.args) {
  const { user, token } = assertFlags(parse(args));

  await login(user, token);
}

interface Flags {
  user?: string;
  token?: string;
}

function assertFlags(args: Args): Flags {
  const { _: [_, user, token, ...remainingArgs], ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("[username]", user, ["string"]);
  checkType("[token]", token, ["string", "number"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { user, token: token && `${token}` } as Flags;
}
