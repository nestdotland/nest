import { limitFields, setupCheckType } from "../../utils/cli.ts";
import { NestCLIError } from "../../utils/error.ts";
import { log } from "../../utils/log.ts";
import { hook, hookPrefix } from "../../utils/const.ts";
import type { Hooks, Json } from "../../utils/types.ts";

export function assertHooks(hooks: Json, file: string, prefix = ""): Hooks {
  const { checkType, typeError } = setupCheckType(file);

  if (Array.isArray(hooks)) {
    log.error("Unable to parses hooks object: received an array.");
    throw new NestCLIError("Config(hooks): received an array");
  }

  let remainingFields = hooks;
  const hooksName = [];

  for (const key of hook) {
    for (const prefix of hookPrefix) {
      hooksName.push(`${prefix}${key}`);
    }
  }

  for (const hookName of hooksName) {
    const { [hookName]: value, ...remaining } = remainingFields;
    checkType(`${prefix}${hookName}`, value, ["string"]);
    remainingFields = remaining;
  }

  limitFields(file, remainingFields, hooksName);

  if (typeError()) throw new NestCLIError("Config(hooks): Invalid type");

  return hooks as Hooks;
}
