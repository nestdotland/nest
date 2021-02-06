import { gray, green, italic, parse } from "../deps.ts";
import { limitArgs, limitOptions } from "../utils/cli.ts";
import { NestCLIError } from "../utils/error.ts";
import { mainCommand, mainOptions } from "./main.ts";
import * as config from "../config/config.ts";
import { lineBreak, log } from "../utils/log.ts";
import { setupCheckType } from "../processing/check_type.ts";
import { promptAndValidate } from "../utils/interact.ts";

import type { Args, Command } from "../utils/types.ts";

export const logoutCommand: Command = {
  name: "logout",
  description: "Remove an existing user account",
  arguments: [{
    name: "[username]",
    description: "",
  }],
  options: mainOptions,
  subCommands: new Map(),
  action,
};

mainCommand.subCommands.set(logoutCommand.name, logoutCommand);

export async function action(args = Deno.args) {
  const { user } = assertFlags(parse(args));

  await logout(user);
}

interface Flags {
  user?: string;
}

function assertFlags(args: Args): Flags {
  const { _: [user, ...remainingArgs], ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("[username]", user, ["string"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { user } as Flags;
}

// **************** logic ****************

/** Remove an existing user account */
export async function logout(username?: string) {
  await config.users.ensureLogged();

  const manager = await config.users.parse();

  const users = Object.keys(manager.users);

  if (username === undefined) {
    log.info("Logged in user(s):");
    for (let i = 0; i < users.length; i++) {
      log.plain(gray("  -"), italic(users[i]));
    }
    lineBreak();

    username = await promptAndValidate({
      message: "Switch to user:",
      invalidMessage:
        "Invalid user. The length of an username must be more than 0 characters.",
      validate: (res) => res.length > 0 && users.includes(res),
      defaultValue: users[0],
    });
  }

  if (!users.includes(username)) {
    log.error("This user is not logged in.");
    throw new NestCLIError("User not logged in (logout)");
  }

  delete manager.users[username];

  const isActiveUser = manager.activeUser === username;

  if (isActiveUser) {
    log.info("The currently active user was logged out.");
    manager.activeUser = users.length > 1
      ? users.filter((user) => user !== username)[0]
      : "";
  }

  await config.users.write(manager);

  lineBreak();
  log.info("Successfully logged out", green(username), "!");

  if (isActiveUser) {
    if (users.length > 1) {
      log.info("Automatically logged in under", green(manager.activeUser), ".");
    } else {
      log.warning("No user is logged in.");
    }
  }
}
