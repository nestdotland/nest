import { parse } from "../../deps.ts";
import { log } from "../utilities/log.ts";
import { publish } from "../publish.ts";
import {
  aliasesFromOptions,
  globalOptions,
  limitArgs,
  limitOptions,
} from "../utilities/cli.ts";
import type { Command, Option } from "../utilities/types.ts";
import { CLIError } from "../error.ts";

interface rawFlags {
  version?: string | number;
}

interface Flags {
  version?: string;
}

const options: Option[] = [
  ...globalOptions,
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
  options,
  subCommands: {},
  action,
};

async function action() {
  const { _: [_, version, ...remainingArgs], pre, ...remainingOptions } = parse(
    Deno.args,
    { alias: aliasesFromOptions(publishCommand.options) },
  );

  limitOptions(remainingOptions, globalOptions);
  limitArgs(remainingArgs);

  const flags = assertFlags({ version });

  await publish();
}

function assertFlags({ version }: rawFlags): Flags {
  if (version !== undefined && typeof version !== "string") {
    log.error(`Version should be of type string. Received ${version}`);
    throw new CLIError("Invalid type (version)");
  }
  return { version };
}
