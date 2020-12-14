import { limitFields, setupCheckType } from "../utilities/cli.ts";
import { NestCLIError } from "../error.ts";
import type { Api } from "../utilities/types.ts";

const emptyApi = {
  versions: [""],
  latestVersion: "",
  lastPublished: "",
  license: "",
};

type RawObject = Record<string, unknown>;

export function assertApi(api: RawObject, file: string, prefix = ""): Api {
  const { checkType, typeError } = setupCheckType(file);

  const {
    versions,
    latestVersion,
    lastPublished,
    license,
    ...remainingFields
  } = api;

  limitFields(file, remainingFields, emptyApi);

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
