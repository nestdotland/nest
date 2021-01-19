import { bold, NestLand, semver } from "../deps.ts";
import { log } from "../utilities/log.ts";
import { version as CLIVersion } from "../version.ts";

export async function upgrade(givenVersion?: string) {
  // TODO: change `eggs` to `nest`
  const versions = await NestLand.sortedVersions("eggs", "nestdotland");

  const latest = versions[versions.length - 1];

  const version = semver.valid(givenVersion || latest);
  if (version === null) {
    log.error(`Invalid version: ${givenVersion}`);
    return;
  }

  if (semver.eq(version, CLIVersion)) {
    log.info(`You are already using version ${CLIVersion} !`);
    return;
  }

  if (!versions.includes(version)) {
    log.error(`Version ${version} has not been found.`);
    log.info("Published versions:", versions.reverse());
    return;
  }

  const upgradeProcess = Deno.run({
    cmd: [
      "deno",
      "install",
      "-Afq",
      `https://x.nest.land/nest@${version}/nest.ts`,
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
    log.error(`Failed to upgrade nest CLI to ${bold(version)} !`);
  } else {
    log.info(`Successfully upgraded nest CLI to ${bold(version)}!`);
  }
}
