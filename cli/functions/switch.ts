import { gray, green, italic } from "../deps.ts";
import { parseUsersJson, writeUsersJson } from "../config/users.json.ts";
import { NestCLIError } from "../error.ts";
import { lineBreak, log } from "../utilities/log.ts";
import { ensureUserLogged } from "./login.ts";
import { promptAndValidate } from "../utilities/interact.ts";

export async function switchUser(username?: string) {
  await ensureUserLogged();

  const manager = await parseUsersJson();

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

  await writeUsersJson(manager);

  log.info("Successfully switched to", green(username), "!");
}
