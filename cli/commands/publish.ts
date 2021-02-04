import { cyan, parse } from "../deps.ts";
import { NestCLIError } from "../error.ts";
import {
  aliasesFromOptions,
  limitArgs,
  limitOptions,
  setupCheckType,
} from "../utilities/cli.ts";
import { mainOptions } from "./main/options.ts";
import { publish } from "../functions/publish.ts";
import { getHooks } from "../config/hooks.ts";

import type { Args, Command, Option } from "../utilities/types.ts";
import type { PublishOptions as Flags } from "../functions/publish.ts";

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
    description:
      "Use the latest git tag as version (ignored if <version> is provided)",
  },
  {
    flag: "--pre",
    argument: "[tag]",
    description: "Publish as a prerelease with optional identifier",
  },
  {
    flag: "--deno",
    argument: "<semver>",
    description: "Semver range for supported deno versions",
  },
  {
    flag: "-w, --wallet",
    argument: "<path>",
    description: "Path to custom arweave wallet",
  },
  {
    flag: "--unlisted",
    description: "Publish as an unlisted version",
  },
];

export const publishCommand: Command = {
  name: "publish",
  description: "Publish your module to the nest.land registry",
  arguments: [{
    name: "[version]",
    description: `semver tag or one of ${cyan("major")}, ${cyan("minor")}, ${
      cyan("patch")
    } (default: ${cyan("patch")})`,
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

  const hooks = await getHooks();

  await hooks.publish(() => publish(flags));
}

function assertFlags(args: Args): Flags {
  const {
    _: [_, version, ...remainingArgs],
    yes,
    "dry-run": dryRun,
    "git-tag": gitTag,
    pre,
    deno,
    wallet,
    unlisted,
    ...remainingOptions
  } = args;

  limitOptions(remainingOptions, options);
  limitArgs(remainingArgs);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("--yes", yes, ["boolean"]);
  checkType("--dry-run", dryRun, ["boolean"]);
  checkType("--git-tag", gitTag, ["boolean"]);
  checkType("--pre", pre, ["string", "boolean"]);
  checkType("--deno", deno, ["string"]);
  checkType("--wallet", wallet, ["string", "number"]);
  checkType("--unlisted", unlisted, ["boolean"]);
  checkType("[version]", version, ["string", "number"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return {
    version: version && `${version}`,
    yes,
    dryRun,
    gitTag,
    pre,
    deno,
    wallet: wallet && `${wallet}`,
    unlisted,
  } as Flags;
}
