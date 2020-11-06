import { path } from "../../deps.ts";
import { readJson } from "../utilities/json.ts";
import { NEST_DIRECTORY } from "./nest.ts";
import type { Module } from "../utilities/types.ts";

export const MODULE_FILE = "module.json";
export const MODULE_PATH = path.join(NEST_DIRECTORY, MODULE_FILE);

interface RawHooks {
  presync: unknown;
  postsync: unknown;
  prepack: unknown;
  postpack: unknown;
  prepublish: unknown;
  postpublish: unknown;
  preaudit: unknown;
  postaudit: unknown;
}

interface RawModule {
  $schema: unknown;

  name: unknown;
  fullName: unknown;
  description: unknown;
  homepage: unknown;
  license: unknown;

  hooks: unknown;

  unlisted: unknown;
  private: unknown;
  [key: string]: unknown;
}

export async function readModule() {
  const json = await readJson(MODULE_PATH) as RawModule;

  const {
    $schema,
    name,
    fullName,
    description,
    homepage,
    license,
    hooks,
    unlisted,
    isPrivate,
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
  ...rest
}: RawModule) {
  return {
    $schema,
    name,
    fullName,
    description,
    homepage,
    license,
    hooks,
    unlisted,
    isPrivate,
  };
}
