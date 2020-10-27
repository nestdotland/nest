import { semver } from "../deps.ts";
import { log } from "./utilities/log.ts";
import { fetchTimeout } from "./utilities/fetch.ts";

export async function upgrade(givenVersion?: string) {
  // TODO update url
  let response: Response;
  try {
    response = await fetchTimeout(
      "https://x.nest.land/api/package/eggs",
      5000,
    );
  } catch {
    log.error("Cannot connect to nest.land .");
    return;
  }
  const json = await response.json();
  if (!json.packageUploadNames) {
    log.error("Cannot get CLI versions.");
    return;
  }

  // ! This part might change in the future
  const versions: string[] = json.packageUploadNames.map((module: string) => {
    const tmpSplit = module.split("@");
    return tmpSplit[1] || "";
  });
  const valid = versions
    .map((version) => semver.valid(version))
    .filter((version) => version !== null);
  const sorted = semver.sort(valid as string[]).reverse();
  const latest = sorted[0];


  const version = semver.valid(givenVersion || latest);
  if (version === null) {
    log.error(`Invalid version: ${givenVersion}`);
    return;
  }

  if (semver.eq(latest, version)) {
    log.info(`You are already using v${version} !`);
    return;
  }

  if (!valid.includes(version)) {
    log.error(`Version ${version} has not been found.`);
    log.info("Published versions:", sorted);
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

  log.debug("stdout: ", stdout);
  log.debug("stderr: ", stderr);

  if (!status.success) {
    log.error(`Failed to upgrade nest CLI to v${version} !`);
    log.error(stderr);
  } else {
    log.info(`Successfully upgraded nest CLI to v${version}!`);
  }
}
