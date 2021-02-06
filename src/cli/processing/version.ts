import { bold, semver, underline } from "../deps.ts";
import { NestCLIError } from "../utils/error.ts";
import { getLatestTag, isGitRepository } from "../utils/git.ts";
import * as config from "../config/config.ts";
import { log } from "../utils/log.ts";

export async function resolveVersion(
  rawVersion: string,
  projectVersion: string,
  pre?: boolean | string,
  gitTag?: boolean,
): Promise<semver.SemVer> {
  const isReleaseType = ["patch", "minor", "major"].includes(rawVersion);

  if (!isReleaseType && !semver.valid(rawVersion)) {
    log.error(rawVersion, "is not a valid semantic version.");
    throw new NestCLIError("Invalid version (publish)");
  }

  if (!semver.valid(projectVersion)) {
    log.error(
      "The project version was altered in the file",
      underline(bold(config.project.FILE)),
      "Report this issue.",
    );
    throw new NestCLIError("Invalid project version (publish)");
  }

  let latestTag = "";

  if (gitTag) {
    if (!await isGitRepository()) {
      log.error(
        bold("--git-tag"),
        "option was provided but the current directory is not a git repository.",
      );
      throw new NestCLIError("Not a git repository (publish)");
    }
    latestTag = await getLatestTag();
    if (latestTag === "") {
      log.error(
        bold("--git-tag"),
        "option was provided but the current repository doesn't contain any tag",
      );
      throw new NestCLIError("No git tag (publish)");
    }
  }

  const baseVersion = gitTag ? latestTag : projectVersion;

  if (projectVersion === "0.0.0") return new semver.SemVer("0.1.0");
  if (isReleaseType) {
    // raw version is a release type
    return new semver.SemVer(baseVersion)
      .inc(
        (pre ? `pre${rawVersion}` : rawVersion) as semver.ReleaseType,
        typeof pre === "string" ? pre : undefined,
      );
  } else {
    if (pre) {
      return new semver.SemVer(rawVersion)
        .inc("pre", typeof pre === "string" ? pre : undefined);
    } else {
      return new semver.SemVer(rawVersion);
    }
  }
}
