import { limitFields } from "../../utils/cli.ts";
import { setupCheckType } from "../../processing/check_type.ts";
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
  if (checkType(`${prefix}users`, users, ["object"], true)) {
    for (const key in users) {
      assertUser(users[key], file, `${prefix}users.${key}.`);
    }
  }

  if ($comment) delete manager.$comment;

  if (typeError()) throw new NestCLIError("Config(user-manager): Invalid type");

  return manager as UserManager;
}
