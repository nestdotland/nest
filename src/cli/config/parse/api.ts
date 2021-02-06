import { limitFields, setupCheckType } from "../../utils/cli.ts";
import { NestCLIError } from "../../utils/error.ts";
import { log } from "../../utils/log.ts";
import type { Api, Json } from "../../utils/types.ts";

export function assertApi(api: Json, file: string, prefix = ""): Api {
  const { checkType, typeError } = setupCheckType(file);

  if (Array.isArray(api)) {
    log.error("Unable to parses api object: received an array.");
    throw new NestCLIError("Config(api): received an array");
  }

  const {
    versions,
    latestVersion,
    lastPublished,
    ...remainingFields
  } = api;

  limitFields(file, remainingFields, [
    "versions",
    "latestVersion",
    "lastPublished",
  ]);

  if (checkType(`${prefix}versions`, versions, ["array"], true)) {
    for (let i = 0; i < versions.length; i++) {
      checkType(`${prefix}versions[${i}]`, versions[i], ["string"], true);
    }
  }
  checkType(`${prefix}latestVersion`, latestVersion, ["string"], true);
  checkType(`${prefix}lastPublished`, lastPublished, ["number"], true);

  if (typeError()) throw new NestCLIError("Config(api): Invalid type");

  return api as Api;
}
