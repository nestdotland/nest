import { parse } from "../../deps.ts";
import { log } from "../utilities/log.ts";
import { upgrade } from "../upgrade.ts";
import { globalOptions, limitArgs, limitOptions } from "../utilities/cli.ts";
import type { Command } from "../utilities/types.ts";
import { CLIError } from "../error.ts";

interface rawFlags {
  version?: string | number;
}

interface Flags {
  version?: string;
}

export const upgradeCommand: Command = {
  name: "upgrade",
  description: "Upgrade nest cli to the given version.\nDefaults to latest.",
  arguments: ["[version]"],
  options: globalOptions,
  subCommands: {},
  action,
};

async function action() {
  const { _: [_, version, ...remainingArgs], ...remainingOptions } = parse(
    Deno.args,
  );

  limitOptions(remainingOptions, globalOptions);
  limitArgs(remainingArgs);

  const flags = assertFlags({ version });

  await upgrade(flags.version);
}

function assertFlags({ version }: rawFlags): Flags {
  if (version !== undefined && typeof version !== "string") {
    log.error(`Version should be of type string. Received ${version}`);
    throw new CLIError("Invalid type (version)");
  }
  return { version };
}
