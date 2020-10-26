import { NestLand, semver } from "../deps.ts";
import { log } from "./utilities/log.ts";

export async function upgrade(version: string) {
  const newVersion = await NestLand.getLatestVersion("eggs");
  if (semver.eq(newVersion, version)) {
    log.info("You are already using the latest CLI version!");
    return;
  }

  const upgradeProcess = Deno.run({
    cmd: [
      "deno",
      "install",
      "--unstable",
      "-A",
      "-f",
      "-n",
      "eggs",
      `https://x.nest.land/eggs@${newVersion}/eggs.ts`,
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

  log.debug("stdout: ", stdout);
  log.debug("stderr: ", stderr);

  if (!status.success) {
    throw new Error("Failed to upgrade to the latest CLI version!");
  }

  log.info("Successfully upgraded eggs cli!");
}
