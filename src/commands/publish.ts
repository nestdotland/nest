import { parse, underline } from "../../deps.ts";
import type { Args } from "../../deps.ts";
import { NestCLIError } from "../error.ts";
import {
  aliasesFromOptions,
  limitArgs,
  limitOptions,
  setupCheckType,
} from "../utilities/cli.ts";
import type { Command, Option } from "../utilities/types.ts";

import { mainOptions } from "./main/options.ts";

import { publish } from "../functions/publish.ts";

const options: Option[] = [
  ...mainOptions,
  {
    flag: "-Y, --yes",
    description: "Disable confirmation prompts",
  },
  {
    flag: "-d, --dry-run",
    description:
      "No changes will actually be made, reports the details of what would have been published",
  },
  {
    flag: "-g, --git-tag",
    description: "Version will be the latest tag from git",
  },
  {
    flag: "--pre",
    argument: "[tag]",
    description: "Publish version as prerelease",
  },
];

export const publishCommand: Command = {
  name: "publish",
  description: "Publishes your module to the nest.land registry",
  arguments: [{
    name: "[version]",
    description: `The version to publish or a release type, ${
      underline("patch")
    } by default`,
  }],
  options,
  subCommands: {},
  action,
};

export async function action() {
  const flags = assertFlags(parse(
    Deno.args,
    { alias: aliasesFromOptions(options) },
  ));

  await publish();
}

interface Flags {
  yes: boolean | undefined;
  dryRun: boolean | undefined;
  gitTag: boolean | undefined;
  pre: boolean | string | undefined;
  version: string | undefined;
}

function assertFlags({
  _: [_, version, ...remainingArgs],
  yes,
  "dry-run": dryRun,
  "git-tag": gitTag,
  pre,
  ...remainingOptions
}: Args): Flags {
  limitOptions(remainingOptions, options);
  limitArgs(remainingArgs);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("--yes", yes, ["boolean"]);
  checkType("--dry-run", dryRun, ["boolean"]);
  checkType("--git-tag", gitTag, ["boolean"]);
  checkType("--pre", pre, ["string", "boolean"]);
  checkType("[version]", version, ["string"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { version, yes, dryRun, gitTag, pre } as Flags;
}
