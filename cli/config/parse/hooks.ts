import { limitFields, setupCheckType } from "../../utilities/cli.ts";
import { NestCLIError } from "../../error.ts";
import { log } from "../../utilities/log.ts";
import type { Hooks, Json } from "../../utilities/types.ts";

export function assertHooks(
  hooks: Json,
  file: string,
  prefix = "",
): Hooks {
  const { checkType, typeError } = setupCheckType(file);

  if (Array.isArray(hooks)) {
    log.error("Unable to parses hooks object: received an array.");
    throw new NestCLIError("Config(hooks): received an array");
  }

  const {
    presync,
    postsync,
    prepack,
    postpack,
    prepublish,
    postpublish,
    preaudit,
    postaudit,
    ...remainingFields
  } = hooks;

  limitFields(file, remainingFields, [
    "presync",
    "postsync",
    "prepack",
    "postpack",
    "prepublish",
    "postpublish",
    "preaudit",
    "postaudit",
  ]);

  checkType(`${prefix}presync`, presync, ["string"]);
  checkType(`${prefix}postsync`, postsync, ["string"]);
  checkType(`${prefix}prepack`, prepack, ["string"]);
  checkType(`${prefix}postpack`, postpack, ["string"]);
  checkType(`${prefix}prepublish`, prepublish, ["string"]);
  checkType(`${prefix}postpublish`, postpublish, ["string"]);
  checkType(`${prefix}preaudit`, preaudit, ["string"]);
  checkType(`${prefix}postaudit`, postaudit, ["string"]);

  if (typeError()) throw new NestCLIError("Config(hooks): Invalid type");

  return hooks as unknown as Hooks;
}
