import { parse } from "../deps.ts";
import { NestCLIError } from "../utils/error.ts";
import { limitArgs, limitOptions } from "../utils/cli.ts";
import { setupCheckType } from "../processing/check_type.ts";
import { mainCommand, mainOptions } from "./main.ts";
import { bold, gray, /* NestLand, */ semver } from "../deps.ts";
import { log } from "../utils/log.ts";
import { version as CLIVersion } from "../../version.ts";

import type { Args, Command } from "../utils/types.ts";

export const upgradeCommand: Command = {
  name: "upgrade",
  description: "Upgrade nest cli to the given version",
  arguments: [{
    name: "[version]",
    description: "A given semver version, the latest by default",
  }],
  options: mainOptions,
  subCommands: new Map(),
  action,
};

mainCommand.subCommands.set(upgradeCommand.name, upgradeCommand);

export async function action(args = Deno.args) {
  const { version } = assertFlags(parse(args));

  await upgrade(version);
}

interface Flags {
  version?: string;
}

function assertFlags(args: Args): Flags {
  const { _: [version, ...remainingArgs], ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("[version]", version, ["string", "number"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { version: version && `${version}` } as Flags;
}

// **************** logic ****************

/** Upgrade nest cli to the given version. */
export async function upgrade(givenVersion?: string) {
  // TODO(@oganexon): recode hatcher
  const versions = [""]; /* await NestLand.sortedVersions("nest", "nest"); */

  const latest = versions[versions.length - 1];

  const version = semver.valid(givenVersion || latest);
  if (version === null) {
    log.error("Invalid version:", givenVersion);
    return;
  }

  if (semver.eq(version, CLIVersion)) {
    log.info("You are already using version", CLIVersion, "!");
    return;
  }

  if (!versions.includes(version)) {
    log.error("Version", version, "has not been found.");
    log.info("Published versions:");
    for (let i = versions.length - 1; i > -1; i--) {
      log.plain(gray("  -"), versions[i]);
    }
    return;
  }

  const upgradeProcess = Deno.run({
    cmd: [
      "deno",
      "install",
      "-Afq",
      `https://nest.land/-/nest@${version}/nest.ts`,
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const status = await upgradeProcess.status();
  upgradeProcess.close();

  const stdout = new TextDecoder("utf-8").decode(await upgradeProcess.output());
  const stderr = new TextDecoder("utf-8").decode(
    await upgradeProcess.stderrOutput(),
  );

  log.debug("stdout:", stdout);
  log.debug("stderr:", stderr);

  if (!status.success) {
    log.plain(stderr);
    log.error("Failed to upgrade nest CLI to", bold(version), ".");
  } else {
    log.info("Successfully upgraded nest CLI to", bold(version), "!");
  }
}
