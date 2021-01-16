import { limitFields, setupCheckType } from "../utilities/cli.ts";
import { NestCLIError } from "../error.ts";
import { assertHooks } from "./hooks.ts";
import type { Meta, RawObject } from "../utilities/types.ts";

export function assertMeta(meta: RawObject, file: string, prefix = ""): Meta {
  const {
    $schema,
    name,
    fullName,
    description,
    homepage,
    license,
    unlisted,
    private: isPrivate,
    hooks,
    ...remainingFields
  } = meta;

  limitFields(file, remainingFields);

  const { checkType, typeError } = setupCheckType(file);

  checkType(`${prefix}$schema`, $schema, ["string"]);
  checkType(`${prefix}name`, name, ["string"], true);
  checkType(`${prefix}fullName`, fullName, ["string"]);
  checkType(`${prefix}description`, description, ["string"]);
  checkType(`${prefix}homepage`, homepage, ["string"]);
  checkType(`${prefix}license`, license, ["string"]);
  checkType(`${prefix}unlisted`, unlisted, ["boolean"]);
  checkType(`${prefix}private`, isPrivate, ["boolean"]);
  checkType(`${prefix}hooks`, hooks, ["object"]);

  if (typeof hooks === "object" && hooks !== null) {
    assertHooks(hooks as RawObject, file, prefix + "hooks.");
  }

  if (typeError()) throw new NestCLIError("Config(meta): Invalid type");

  return meta as unknown as Meta;
}