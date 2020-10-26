/* import { cac } from "./deps.ts";
import type { CAC } from "./deps.ts"; */
// @deno-types="https://unpkg.com/cac/mod.d.ts"
import { cac } from "https://unpkg.com/cac@6.6.1/mod.js";
import { handleError, log, setupLog } from "./src/utilities/log.ts";
import { version } from "./src/version.ts";

import { publishCommand } from "./src/commands/publish.ts";
import { upgradeCommand } from "./src/commands/upgrade.ts";

// const nest = <unknown> cac("nest") as CAC;
const nest = cac("nest");

nest
  .help()
  .version(version, "-V, --version")
  .option("-L, --log-level [level]", "Set log level")
  .option("-l, --log [path]", "Specify filepath to output logs")
/*   .action((dir, options) => {
    console.log('remove ' + dir + (options.recursive ? ' recursively' : ''))
  }) */

publishCommand(nest);
upgradeCommand(nest);

setupLog();

try {
  nest.parse(["deno", "cli"].concat(Deno.args), { run: false });

  await nest.runMatchedCommand();
  // throw new Error("bar")
} catch (err) {
  if (
    err.message.match(
      /^(missing required args for command \`|Unknown option \`|option \`)/,
    )
  ) {
    nest.outputHelp();
    console.log();
    log.error(err.message);
  } else {
    await handleError(err);
  }
  Deno.exit(1);
}
