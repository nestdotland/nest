import { path } from "../../deps.ts";
import { readJson } from "../utilities/json.ts";
import { NEST_DIRECTORY } from "./nest.ts";
import { log, setupLogLevel } from "../utilities/log.ts";
import type { Module } from "../utilities/types.ts";
import { limitFields, setupCheckType } from "../utilities/cli.ts";
import { NestCLIError } from "../error.ts";

export const MODULE_FILE = "module.json";
export const MODULE_PATH = path.join(NEST_DIRECTORY, MODULE_FILE);

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

const emptyModule = {
  $schema: "",

  name: "",
  fullName: "",
  description: "",
  homepage: "",
  license: "",

  hooks: emptyHooks,

  unlisted: false,
  private: false,
};

type RawJson = Record<string, unknown>;

export async function readModule() {
  const json = await readJson(MODULE_PATH) as RawJson;

  const {
    $schema,
    name,
    fullName,
    description,
    homepage,
    license,
    hooks,
    unlisted,
    private: isPrivate,
  } = assertModule(json);
}

function assertModule({
  $schema,
  name,
  fullName,
  description,
  homepage,
  license,
  hooks,
  unlisted,
  private: isPrivate,
  ...remainingFields
}: RawJson): Module {
  limitFields(MODULE_FILE, remainingFields, emptyModule);

  const { checkType, typeError } = setupCheckType(MODULE_FILE);

  checkType("$schema", $schema, ["string"]);
  checkType("name", name, ["string"], true);
  checkType("$schema", $schema, ["string"]);
  checkType("fullName", fullName, ["string"]);
  checkType("description", description, ["string"]);
  checkType("homepage", homepage, ["string"]);
  checkType("license", license, ["string"]);
  checkType("hooks", hooks, ["object"]);
  checkType("unlisted", unlisted, ["boolean"]);
  checkType("private", isPrivate, ["boolean"]);

  if (typeError()) throw new NestCLIError("Config: Invalid type");

  return {
    $schema,
    name,
    fullName,
    description,
    homepage,
    license,
    hooks,
    unlisted,
    private: isPrivate,
  } as Module;
}

setupLogLevel("info");

await readModule();
