import { parse, underline } from "../../deps.ts";
import { log } from "../utilities/log.ts";
import { NestCLIError } from "../error.ts";
import {
  aliasesFromOptions,
  limitArgs,
  limitOptions,
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
  const {
    _: [_, version, ...remainingArgs],
    yes,
    "dry-run": dryRun,
    "git-tag": gitTag,
    pre,
    ...remainingOptions
  } = parse(
    Deno.args,
    { alias: aliasesFromOptions(options) },
  );

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  const flags = assertFlags({ version, yes, dryRun, gitTag, pre });

  await publish();
}

interface rawFlags {
  yes: unknown;
  dryRun: unknown;
  gitTag: unknown;
  pre: unknown;
  version: string | number | undefined;
}

interface Flags {
  yes: boolean | undefined;
  dryRun: boolean | undefined;
  gitTag: boolean | undefined;
  pre: boolean | string | undefined;
  version: string | undefined;
}

function assertFlags({ version, yes, dryRun, gitTag, pre }: rawFlags): Flags {
  if (yes !== undefined && typeof yes !== "boolean") {
    log.error(`Version should be of type boolean. Received ${yes}`);
    throw new NestCLIError("Invalid type (yes)");
  }
  if (dryRun !== undefined && typeof dryRun !== "boolean") {
    log.error(`Version should be of type boolean. Received ${dryRun}`);
    throw new NestCLIError("Invalid type (dryRun)");
  }
  if (gitTag !== undefined && typeof gitTag !== "boolean") {
    log.error(`Version should be of type string. Received ${gitTag}`);
    throw new NestCLIError("Invalid type (gitTag)");
  }
  if (
    pre !== undefined && typeof pre !== "string" && typeof pre !== "boolean"
  ) {
    log.error(`Version should be of type string or boolean. Received ${pre}`);
    throw new NestCLIError("Invalid type (pre)");
  }
  if (version !== undefined && typeof version !== "string") {
    log.error(`Version should be of type string. Received ${version}`);
    throw new NestCLIError("Invalid type (version)");
  }
  return { version, yes, dryRun, gitTag, pre };
}
