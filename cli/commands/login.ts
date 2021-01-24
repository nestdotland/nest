import { parse } from "../deps.ts";
import type { Args } from "../deps.ts";
import { limitArgs, limitOptions, setupCheckType } from "../utilities/cli.ts";
import type { Command } from "../utilities/types.ts";
import { NestCLIError } from "../error.ts";
import { mainOptions } from "./main/options.ts";

import { login } from "../functions/login.ts";

export const loginCommand: Command = {
  name: "login",
  description: "Add an existing user account",
  arguments: [{
    name: "[username]",
    description: "",
  }, {
    name: "[token]",
    description: "",
  }],
  options: mainOptions,
  subCommands: {},
  action,
};

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
  checkType("[token]", token, ["string"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { user, token } as Flags;
}
