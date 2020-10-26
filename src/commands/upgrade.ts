import type { CAC } from "../../deps.ts"
import type { DefaultOptions } from "../utilities/command.ts";
import { setupLogLevel } from "../utilities/log.ts";
import { upgrade } from "../upgrade.ts";

export const upgradeCommand = (nest: CAC) =>
  nest
    .command(
      "upgrade [version]",
      "Upgrade nest cli to the given version.\nDefaults to latest.",
    )
    .action(async (version: string, options: DefaultOptions) => {
      setupLogLevel(options.logLevel);
      await upgrade(version);
    });
