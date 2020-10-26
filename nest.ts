// @deno-types="https://unpkg.com/cac@6.6.1/mod.d.ts"
import { cac } from "./cli_deps.ts"
import { setupLog, log } from "./src/utilities/log.ts";
import { version } from "./src/version.ts";

import { publishCommand } from "./src/commands/publish.ts";

const nest = cac("nest");

nest.help();
nest.version(version, "-V, --version");
nest.option("-L, --log-level [level]", "Set log level");
nest.option("-l, --log [path]", "Specify filepath to output logs");

publishCommand(nest)

setupLog()

try {
  nest.parse(["deno", "cli"].concat(Deno.args), { run: false });

  await nest.runMatchedCommand();
} catch (error) {
}
