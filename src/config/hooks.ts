import { limitFields, setupCheckType } from "../utilities/cli.ts";
import { NestCLIError } from "../error.ts";
import type { Hooks, RawObject } from "../utilities/types.ts";

const emptyHooks = {
  presync: "",
  postsync: "",
  prepack: "",
  postpack: "",
  prepublish: "",
  postpublish: "",
  preaudit: "",
  postaudit: "",
};

export function assertHooks(
  hooks: RawObject,
  file: string,
  prefix = "",
): Hooks {
  const { checkType, typeError } = setupCheckType(file);

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

  limitFields(file, remainingFields, emptyHooks);

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
