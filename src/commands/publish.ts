import { parse } from "../../deps.ts";
import { log } from "../utilities/log.ts";
import { NestCLIError } from "../error.ts";
import { limitArgs, limitOptions } from "../utilities/cli.ts";
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
    flag: "--dry-run",
    description:
      "No changes will actually be made, reports the details of what would have been published",
  },
  {
    flag: "--pre",
    argument: "[tag]",
    description: "",
  },
];

export const publishCommand: Command = {
  name: "publish",
  description: "Publishes your module to the nest.land registry",
  arguments: ["[version]"],
  options: mainOptions,
  subCommands: {},
  action,
};

export async function action() {
  const { _: [_, version, ...remainingArgs], ...remainingOptions } = parse(
    Deno.args,
  );

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  const flags = assertFlags({ version });

  await publish();
}

interface rawFlags {
  version?: string | number;
}

interface Flags {
  version?: string;
}

function assertFlags({ version }: rawFlags): Flags {
  if (version !== undefined && typeof version !== "string") {
    log.error(`Version should be of type string. Received ${version}`);
    throw new NestCLIError("Invalid type (version)");
  }
  return { version };
}
