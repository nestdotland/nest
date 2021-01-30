import { limitFields, setupCheckType } from "../../utilities/cli.ts";
import { NestCLIError } from "../../error.ts";
import type { JSONValue, UserManager } from "../../utilities/types.ts";

export function assertUser(
  user: JSONValue,
  file: string,
  prefix = "",
): UserManager {
  const { checkType, typeError } = setupCheckType(file);

  checkType(`${prefix}`, user, ["object"], true);

  if (typeof user === "object" && user !== null && !Array.isArray(user)) {
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

  return user as unknown as UserManager;
}
