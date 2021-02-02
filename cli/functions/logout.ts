import { gray, green, italic } from "../deps.ts";
import * as usersConfig from "../config/files/users.json.ts";
import { NestCLIError } from "../error.ts";
import { lineBreak, log } from "../utilities/log.ts";
import { ensureUserLogged } from "./login.ts";
import { promptAndValidate } from "../utilities/interact.ts";

export async function logout(username?: string) {
  await ensureUserLogged();

  const manager = await usersConfig.parse();

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

  await usersConfig.write(manager);

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
