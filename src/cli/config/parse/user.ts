import { limitFields } from "../../utils/cli.ts";
import { setupCheckType } from "../../processing/check_type.ts";
import { NestCLIError } from "../../utils/error.ts";
import type { JSONValue, UserManager } from "../../utils/types.ts";

export function assertUser(
  user: JSONValue,
  file: string,
  prefix = "",
): UserManager {
  const { checkType, typeError } = setupCheckType(file);

  if (checkType(`${prefix}`, user, ["object"], true)) {
    const {
      name,
      token,
      ...remainingFields
    } = user;

    limitFields(file, remainingFields, ["name", "token"]);

    checkType(`${prefix}name`, name, ["string"], true);
    checkType(`${prefix}token`, token, ["string"], true);
  }

  if (typeError()) throw new NestCLIError("Config(user): Invalid type");

  return user as UserManager;
}
