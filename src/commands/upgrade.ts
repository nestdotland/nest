import { parse } from "../../deps.ts";
import type { Args } from "../../deps.ts";
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
    description: "A given version, the latest by default",
  }],
  options: mainOptions,
  subCommands: {},
  action,
};

export async function action() {
  const { version } = assertFlags(parse(Deno.args));

  await upgrade(version);
}

interface Flags {
  version: string | undefined;
}

function assertFlags(
  { _: [_, version, ...remainingArgs], ...remainingOptions }: Args,
): Flags {
  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  if (version !== undefined && typeof version !== "string") {
    log.error(`Version should be of type string. Received ${version}`);
    throw new NestCLIError("Invalid type (version)");
  }
  return { version };
}
