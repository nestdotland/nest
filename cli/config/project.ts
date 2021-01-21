import { limitFields, setupCheckType } from "../utilities/cli.ts";
import { NestCLIError } from "../error.ts";
import { assertMeta } from "./meta.ts";
import { assertApi } from "./api.ts";
import { log } from "../utilities/log.ts";
import type { Json, Project } from "../utilities/types.ts";

export function assertProject(
  module: Json,
  file: string,
  prefix = "",
): Project {
  if (Array.isArray(module)) {
    log.error("Unable to parses api object: received an array.");
    throw new NestCLIError("Config: received an array");
  }

  const {
    $comment,
    meta,
    api,
    version,
    lastSync,
    nextAutoSync,
    ...remainingFields
  } = module;

  limitFields(file, remainingFields);

  const { checkType, typeError } = setupCheckType(file);

  checkType(`${prefix}$comment`, $comment, ["string"]);
  checkType(`${prefix}meta`, meta, ["object"], true);
  checkType(`${prefix}api`, api, ["object"], true);
  checkType(`${prefix}version`, version, ["string"], true);
  checkType(`${prefix}lastSync`, lastSync, ["number"], true);
  checkType(`${prefix}nextAutoSync`, nextAutoSync, ["number"], true);

  if (typeof meta === "object" && meta !== null) {
    assertMeta(meta, file, `${prefix}meta.`);
  }

  if (typeof api === "object" && api !== null) {
    assertApi(api, file, `${prefix}api.`);
  }

  if ($comment) delete module.$comment;

  if (typeError()) throw new NestCLIError("Config: Invalid type");

  return module as unknown as Project;
}
