import { green } from "../deps.ts";
import {
  ensureUsersJson,
  parseUsersJson,
  usersJsonExists,
  writeUsersJson,
} from "../config/users.json.ts";
import { NestCLIError } from "../error.ts";
import { log } from "../utilities/log.ts";
import { promptAndValidate } from "../utilities/interact.ts";
import { User, UserManager } from "../utilities/types.ts";

export async function login(username?: string, token?: string) {
  let manager: UserManager;

  if (await usersJsonExists()) {
    manager = await parseUsersJson();
  } else {
    await ensureUsersJson();
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

  await writeUsersJson(manager);

  log.info("Successfully logged in under", green(username), "!");
}

export async function ensureUserLogged(): Promise<void> {
  if (!await usersJsonExists()) {
    log.error("No user logged in, use", green("nest login"), "to add users.");
    throw new NestCLIError("No user logged in (login)");
  }
}

export async function getActiveUser(): Promise<User> {
  await ensureUserLogged();
  const { users, activeUser } = await parseUsersJson();
  return users[activeUser];
}
