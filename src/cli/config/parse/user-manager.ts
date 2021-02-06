import { limitFields, setupCheckType } from "../../utils/cli.ts";
import { NestCLIError } from "../../utils/error.ts";
import { log } from "../../utils/log.ts";
import { assertUser } from "./user.ts";
import type { Json, UserManager } from "../../utils/types.ts";

export function assertUserManager(
  manager: Json,
  file: string,
  prefix = "",
): UserManager {
  const { checkType, typeError } = setupCheckType(file);

  if (Array.isArray(manager)) {
    log.error("Unable to parses user manager object: received an array.");
    throw new NestCLIError("Config(user-manager): received an array");
  }

  const {
    $comment,
    activeUser,
    users,
    ...remainingFields
  } = manager;

  limitFields(file, remainingFields, ["$comment", "activeUser", "users,"]);

  checkType(`${prefix}activeUser`, activeUser, ["string"], true);
  if (checkType(`${prefix}users`, users, ["array"], true)) {
    for (let i = 0; i < users.length; i++) {
      assertUser(users[i], file, `${prefix}users[${i}].`);
    }
  }

  if ($comment) delete manager.$comment;

  if (typeError()) throw new NestCLIError("Config(user-manager): Invalid type");

  return manager as UserManager;
}
