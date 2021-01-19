import { parse, underline } from "../deps.ts";
import type { Args } from "../deps.ts";
import { NestCLIError } from "../error.ts";
import {
  aliasesFromOptions,
  limitArgs,
  limitOptions,
  setupCheckType,
} from "../utilities/cli.ts";
import type { Command, Option } from "../utilities/types.ts";
import type { PublishOptions as Flags } from "../functions/publish.ts";

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
  {
    flag: "-w, --wallet",
    argument: "<path>",
    description: "Publish with user wallet"
  }
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

export async function action(args = Deno.args) {
  const flags = assertFlags(parse(
    args,
    { alias: aliasesFromOptions(options) },
  ));

  await publish(flags);
}

function assertFlags(args: Args): Flags {
  const {
    _: [_, version, ...remainingArgs],
    yes,
    "dry-run": dryRun,
    "git-tag": gitTag,
    pre,
    wallet,
    ...remainingOptions
  } = args;

  limitOptions(remainingOptions, options);
  limitArgs(remainingArgs);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("--yes", yes, ["boolean"]);
  checkType("--dry-run", dryRun, ["boolean"]);
  checkType("--git-tag", gitTag, ["boolean"]);
  checkType("--pre", pre, ["string", "boolean"]);
  checkType("--wallet", pre, ["string"]);
  checkType("[version]", version, ["string"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { version, yes, dryRun, gitTag, pre, wallet } as Flags;
}
