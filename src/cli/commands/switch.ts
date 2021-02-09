import { gray, green, italic, parse } from "../deps.ts";
import { CommandMap, limitArgs, limitOptions } from "../utils/cli.ts";
import { setupCheckType } from "../processing/check_type.ts";
import { NestCLIError } from "../utils/error.ts";
import { mainCommand, mainOptions } from "./main.ts";
import * as config from "../config/config.ts";
import { lineBreak, log } from "../utils/log.ts";
import { promptAndValidate } from "../utils/interact.ts";

import type { Args, Command } from "../utils/types.ts";

export const switchCommand: Command = {
  name: "switch",
  description: "Change currently logged in user",
  arguments: [{
    name: "[username]",
    description: "A username",
  }],
  options: mainOptions,
  subCommands: new CommandMap(),
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
  const { _: [user, ...remainingArgs], ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("[username]", user, ["string"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { user } as Flags;
}

// **************** logic ****************

/** Change currently logged in user. */
export async function switchUser(username?: string) {
  await config.users.ensureLogged();

  const manager = await config.users.parse();

  const inactiveUsers = Object.keys(manager.users)
    .filter((user) => user !== manager.activeUser);

  if (inactiveUsers.length === 0) {
    log.error(
      "Only one user is logged in, cannot switch users. Use",
      green("nest login"),
      "to add users.",
    );
    throw new NestCLIError("Only one user is logged in, cannot switch users.");
  }

  if (username === undefined) {
    log.info("Active user:", green(manager.activeUser));
    log.info("Inactive user(s):");
    for (let i = 0; i < inactiveUsers.length; i++) {
      log.plain(gray("  -"), italic(inactiveUsers[i]));
    }
    lineBreak();

    username = await promptAndValidate({
      message: "Switch to user:",
      invalidMessage:
        "Invalid user. The length of an username must be more than 0 characters.",
      validate: (res) => res.length > 0 && inactiveUsers.includes(res),
      defaultValue: inactiveUsers[0],
    });
  }

  if (!inactiveUsers.includes(username)) {
    log.error("This user is not logged in.");
    throw new NestCLIError("User not logged in (switch)");
  }

  manager.activeUser = username;

  await config.users.write(manager);

  log.info("Successfully switched to", green(username), "!");
}
