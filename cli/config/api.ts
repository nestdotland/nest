import { limitFields, setupCheckType } from "../utilities/cli.ts";
import { NestCLIError } from "../error.ts";
import { log } from "../utilities/log.ts";
import type { Api, Json } from "../utilities/types.ts";

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
    license,
    ...remainingFields
  } = api;

  limitFields(file, remainingFields);

  checkType(`${prefix}versions`, versions, ["array"], true);
  checkType(`${prefix}latestVersion`, latestVersion, ["string"], true);
  checkType(`${prefix}lastPublished`, lastPublished, ["number"], true);
  checkType(`${prefix}license`, license, ["string"], true);

  if (Array.isArray(versions)) {
    for (let i = 0; i < versions.length; i++) {
      checkType(`${prefix}versions[${i}]`, versions[i], ["string"], true);
    }
  }

  if (typeError()) throw new NestCLIError("Config(api): Invalid type");

  return api as unknown as Api;
}
