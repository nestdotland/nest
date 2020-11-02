import { parse } from "../../deps.ts";
import { log } from "../utilities/log.ts";
import { NestCLIError } from "../error.ts";
import { limitArgs, limitOptions } from "../utilities/cli.ts";
import type { Command } from "../utilities/types.ts";

import { mainOptions } from "./main/options.ts";

import { upgrade } from "../functions/upgrade.ts";

export const upgradeCommand: Command = {
  name: "upgrade",
  description: "Upgrade nest cli to the given version",
  arguments: [{
    name: "[version]",
    description: "A given version, the latest by default"
  }],
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

  await upgrade(flags.version);
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
