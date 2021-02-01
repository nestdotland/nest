import { limitFields, setupCheckType } from "../../utilities/cli.ts";
import { NestCLIError } from "../../error.ts";
import { assertHooks } from "./hooks.ts";
import { log } from "../../utilities/log.ts";
import type { Json, Meta } from "../../utilities/types.ts";

export function assertMeta(meta: Json, file: string, prefix = ""): Meta {
  if (Array.isArray(meta)) {
    log.error("Unable to parses meta object: received an array.");
    throw new NestCLIError("Config(meta): received an array");
  }

  const {
    $schema,
    main,
    bin,
    fullName,
    description,
    logo,
    homepage,
    repository,
    issues,
    license,
    unlisted,
    private: isPrivate,
    keywords,
    hooks,
    ...remainingFields
  } = meta;

  limitFields(file, remainingFields, [
    "$schema",
    "main",
    "bin",
    "fullName",
    "description",
    "logo",
    "homepage",
    "repository",
    "issues",
    "license",
    "unlisted",
    "private",
    "keywords",
    "hooks",
  ]);

  const { checkType, typeError } = setupCheckType(file);

  checkType(`${prefix}$schema`, $schema, ["string"]);
  checkType(`${prefix}main`, main, ["string"]);
  checkType(`${prefix}bin`, bin, ["array"]);
  checkType(`${prefix}fullName`, fullName, ["string"]);
  checkType(`${prefix}description`, description, ["string"]);
  checkType(`${prefix}logo`, logo, ["string"]);
  checkType(`${prefix}homepage`, homepage, ["string"]);
  checkType(`${prefix}repository`, repository, ["string"]);
  checkType(`${prefix}issues`, issues, ["string"]);
  checkType(`${prefix}license`, license, ["string"]);
  checkType(`${prefix}unlisted`, unlisted, ["boolean"]);
  checkType(`${prefix}private`, isPrivate, ["boolean"]);
  checkType(`${prefix}keywords`, keywords, ["array"]);
  checkType(`${prefix}hooks`, hooks, ["object"]);

  if (typeof hooks === "object" && hooks !== null) {
    assertHooks(hooks, file, `${prefix}hooks.`);
  }

  if (Array.isArray(bin)) {
    for (let i = 0; i < bin.length; i++) {
      checkType(`${prefix}bin[${i}]`, bin[i], ["string"], true);
    }
  }

  if (Array.isArray(keywords)) {
    for (let i = 0; i < keywords.length; i++) {
      checkType(`${prefix}keywords[${i}]`, keywords[i], ["string"], true);
    }
  }

  if ($schema) delete meta.$schema;

  if (typeError()) throw new NestCLIError("Config(meta): Invalid type");

  return meta as Meta;
}
