import { bold, dim, gray, green, red, semver, underline } from "../deps.ts";
import { log, underlineBold } from "../utilities/log.ts";
import { getLatestTag, isGitRepository } from "../utilities/git.ts";
import { NestCLIError } from "../error.ts";
import { readIgnore } from "../config/files/ignore.ts";
import { DATA_FILE, readDataJson } from "../config/files/data.json.ts";
import { confirm } from "../utilities/interact.ts";
import { publish as directPublish } from "../../lib/publish.ts";
import { isConfigUpToDate } from "./sync.ts";

export interface PublishOptions {
  yes?: boolean;
  dryRun?: boolean;
  gitTag?: boolean;
  pre?: boolean | string;
  version?: string;
  wallet?: string;
}

const MAX_BUNDLE_SIZE = 200;

export async function publish(
  {
    yes = false,
    dryRun = false,
    gitTag = false,
    pre = false,
    version: rawVersion = "patch",
    wallet,
  }: PublishOptions,
): Promise<void> {
  const files = await readIgnore();

  // TODO
  const token = "";

  const project = await readDataJson();

  const isReleaseType = ["patch", "minor", "major"].includes(rawVersion);

  if (!isReleaseType && !semver.valid(rawVersion)) {
    log.error(`${rawVersion} is not a valid semantic version.`);
    throw new NestCLIError("Invalid version (publish)");
  }

  // shouldn't happen after a sync
  if (!semver.valid(project.version)) {
    log.error(
      `The project version was altered in the file ${
        underlineBold(DATA_FILE)
      }. Report this issue.`,
    );
    throw new NestCLIError("Invalid project version (publish)");
  }

  let latestTag = "";

  if (gitTag) {
    if (!await isGitRepository()) {
      log.error(
        `${
          bold("--git-tag")
        } option was provided but the current directory is not a git repository.`,
      );
      throw new NestCLIError("Not a git repository (publish)");
    }
    latestTag = await getLatestTag();
    if (latestTag === "") {
      log.error(
        `${
          bold("--git-tag")
        } option was provided but the current repository doesn't contain any tag.`,
      );
      throw new NestCLIError("No git tag (publish)");
    }
  }

  const baseVersion = gitTag ? latestTag : project.version;

  const version = isReleaseType
    ? new semver.SemVer(baseVersion).inc(
      pre
        ? `pre${rawVersion}` as semver.ReleaseType
        : rawVersion as semver.ReleaseType,
      typeof pre === "string" ? pre : undefined,
    )
    : new semver.SemVer(rawVersion);

  const fileSize = files.map((file) => Deno.lstat(file));
  const settledFileSize = await Promise.allSettled(fileSize);
  const totalSize = settledFileSize.reduce(
    (previous, current) =>
      previous + (current.status === "fulfilled" ? current.value.size : 0),
    0,
  );

  const filesToPublish = files.reduce(
    (previous, current, index) => {
      const fileInfo = settledFileSize[index];
      const size = fileInfo.status === "fulfilled"
        ? gray(dim("(" + (fileInfo.value.size / 1000000).toString() + "MB)"))
        : red(`Error while computing file size: ${fileInfo.reason}`);
      return `${previous}\n        - ${dim(current)}  ${size}`;
    },
    "Files to publish:",
  );
  log.info(filesToPublish);

  if (totalSize > MAX_BUNDLE_SIZE * 1e6 && !wallet) {
    log.warning(
      `Total ${
        underline("estimated")
      } file size exceed ${MAX_BUNDLE_SIZE}Mb. Use your wallet if greater.`,
    );
  }

  if (!await isConfigUpToDate()) {
    log.warning(
      "Local config is not up to date. You should synchronize it with",
      bold(green("nest sync")),
    );
  }

  if (!yes) {
    const confirmation = await confirm("Proceed with publication ?", false);

    if (!confirmation) {
      log.info("Publish cancelled.");
      return;
    }
  }

  if (dryRun) return;

  await directPublish(project.meta, version, files, token, wallet);
}
