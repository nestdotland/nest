import { limitFields } from "../../utils/cli.ts";
import { setupCheckType } from "../../processing/check_type.ts";
import { NestCLIError } from "../../utils/error.ts";
import { assertHooks } from "./hooks.ts";
import { log } from "../../utils/log.ts";
import type { Json, Meta } from "../../utils/types.ts";

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
  if (checkType(`${prefix}bin`, bin, ["array"])) {
    for (let i = 0; i < bin.length; i++) {
      checkType(`${prefix}bin[${i}]`, bin[i], ["string"], true);
    }
  }
  checkType(`${prefix}fullName`, fullName, ["string"]);
  checkType(`${prefix}description`, description, ["string"]);
  checkType(`${prefix}logo`, logo, ["string"]);
  checkType(`${prefix}homepage`, homepage, ["string"]);
  checkType(`${prefix}repository`, repository, ["string"]);
  checkType(`${prefix}issues`, issues, ["string"]);
  checkType(`${prefix}license`, license, ["string"]);
  checkType(`${prefix}unlisted`, unlisted, ["boolean"]);
  checkType(`${prefix}private`, isPrivate, ["boolean"]);
  if (checkType(`${prefix}keywords`, keywords, ["array"])) {
    for (let i = 0; i < keywords.length; i++) {
      checkType(`${prefix}keywords[${i}]`, keywords[i], ["string"], true);
    }
  }
  if (checkType(`${prefix}hooks`, hooks, ["object"])) {
    assertHooks(hooks, file, `${prefix}hooks.`);
  }

  if ($schema) delete meta.$schema;

  if (typeError()) throw new NestCLIError("Config(meta): Invalid type");

  return meta as Meta;
}
