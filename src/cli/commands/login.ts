import { green, parse } from "../deps.ts";
import { CommandMap, limitArgs, limitOptions } from "../utils/cli.ts";
import { NestCLIError } from "../utils/error.ts";
import { mainCommand, mainOptions } from "./main.ts";
import * as config from "../config/config.ts";
import { log } from "../utils/log.ts";
import { promptAndValidate } from "../utils/interact.ts";
import { setupCheckType } from "../processing/check_type.ts";
import { User, UserManager } from "../utils/types.ts";

import type { Args, Command } from "../utils/types.ts";

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
  subCommands: new CommandMap(),
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
  const { _: [user, token, ...remainingArgs], ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("[username]", user, ["string"]);
  checkType("[token]", token, ["string", "number"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { user, token: token && `${token}` } as Flags;
}

// **************** logic ****************

/** Add an existing user account */
export async function login(username?: string, token?: string) {
  let manager: UserManager;

  if (await config.users.exists()) {
    manager = await config.users.parse();
  } else {
    await config.users.ensure();
    manager = {
      activeUser: "",
      users: {},
    };
  }

  if (username === undefined) {
    username = await promptAndValidate({
      message: "Username",
      invalidMessage:
        "The length of an username must be more than 0 characters.",
      validate: (res) => res.length > 0,
    });
  }

  if (username in manager.users) {
    log.warning("This user was already logged in. Token will be updated.");
  }

  if (token === undefined) {
    token = await promptAndValidate({
      message: "Token",
      invalidMessage: "The length of a token must be more than 0 characters.",
      validate: (res) => res.length > 0,
    });
  }

  manager.activeUser = username;
  manager.users[username] = {
    name: username,
    token,
  };

  await config.users.write(manager);

  log.info("Successfully logged in under", green(username), "!");
}
