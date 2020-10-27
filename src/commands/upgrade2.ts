import { parse } from "https://deno.land/std@0.74.0/flags/mod.ts";
import { log } from "../utilities/log.ts";
import { upgrade } from "../upgrade.ts";
import { noMoreArgs, noMoreOptions } from "../utilities/cli.ts";

export const upgradeHelp = "";

export async function upgradeCommand() {
  const { _: [_, version, ...args], ...options } = parse(Deno.args);
  noMoreOptions(options);
  noMoreArgs(args);
  if (version !== undefined && typeof version !== "string") {
    log.error(`Version should be of type string. Received ${version}`);
    throw new Error("");
  }
  await upgrade(version);
}
