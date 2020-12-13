import { limitFields, setupCheckType } from "../../utilities/cli.ts";
import { NestCLIError } from "../../error.ts";
import type { Module } from "../../utilities/types.ts";
import { assertMeta } from "./meta.ts";
import { assertApi } from "./api.ts";

const emptyModule = {
  meta: {},

  api: {},

  version: "",
  lastSync: 0,
  nextAutoSync: 0,
};

type RawObject = Record<string, unknown>;

export function assertModule(
  module: RawObject,
  file: string,
  prefix = "",
): Module {
  const {
    meta,
    api,
    version,
    lastSync,
    nextAutoSync,
    ...remainingFields
  } = module;

  limitFields(file, remainingFields, emptyModule);

  const { checkType, typeError } = setupCheckType(file);

  checkType(`${prefix}meta`, meta, ["object"],true);
  checkType(`${prefix}api`, api, ["object"], true);
  checkType(`${prefix}version`, version, ["string"], true);
  checkType(`${prefix}lastSync`, lastSync, ["number"], true);
  checkType(`${prefix}nextAutoSync`, nextAutoSync, ["number"], true);

  if (typeof meta === "object" && meta !== null) {
    assertMeta(meta as RawObject, file, `${prefix}meta.`);
  }

  if (typeof api === "object" && api !== null) {
    assertApi(api as RawObject, file, `${prefix}api.`);
  }

  if (typeError()) throw new NestCLIError("Config: Invalid type");

  return meta as unknown as Module;
}
