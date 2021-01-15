import { bold, dim, generateUUID, gray, red, semver, Tar } from "../deps.ts";
import { log } from "../utilities/log.ts";
import { underlineBold } from "../utilities/string.ts";
import { getLatestTag, isGitRepository } from "../utilities/git.ts";
import { NestCLIError, NestError } from "../error.ts";
import { publishModule, stageModule } from "../api/todo_.ts";
import { readIgnore } from "../config/files/ignore.ts";
import { DATA_FILE, readDataJson } from "../config/files/data.json.ts";
import { confirm } from "../utilities/interact.ts";
import type { Meta } from "../utilities/types.ts";

export interface PublishOptions {
  yes: boolean | undefined;
  dryRun: boolean | undefined;
  gitTag: boolean | undefined;
  pre: boolean | string | undefined;
  version: string | undefined;
}

export async function publish(
  {
    yes = false,
    dryRun = false,
    gitTag = false,
    pre = false,
    version: rawVersion = "patch",
  }: PublishOptions,
): Promise<void> {
  const files = await readIgnore();

  const project = await readDataJson();

  const isReleaseType = ["patch", "minor", "major"].includes(rawVersion);

  if (!isReleaseType && !semver.valid(rawVersion)) {
    log.error(`${rawVersion} is not a valid semantic version.`);
    throw new NestCLIError("Invalid version (publish)");
  }

  if (!semver.valid(project.version)) {
    log.error(
      `The project version was altered in the file ${
        underlineBold(DATA_FILE)
      }. Please sync your module.`,
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

  // TODO: get wallet
  const wallet = "";

  const fileSize = files.map((file) => Deno.lstat(file));
  const settledFileSize = await Promise.allSettled(fileSize);

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

  if (!yes) {
    const confirmation = await confirm(
      "Are you sure you want to publish this module?",
      false,
    );

    if (!confirmation) {
      log.info("Publish cancelled.");
      return;
    }
  }

  if (dryRun) return;

  await directPublish(project.meta, version, files, wallet);
}

/** Lower level version of the publish function */
export async function directPublish(
  meta: Meta,
  version: semver.SemVer,
  files: string[],
  wallet: string,
) {
  const uuid = generateUUID();
  const tar = new Tar();

  /** Step 1 - create a tarball */

  for (const file of files) {
    if (!file.startsWith("/")) {
      log.error(
        `Incorrect file path: ${
          underlineBold(file)
        } It should start with a slash ("/").`,
      );
      throw new NestError("Incorrect file path (publish)");
    }
    try {
      await tar.append(file, {
        filePath: `.${file}`,
      });
    } catch (err) {
      log.error(
        `Unable to append ${underlineBold(file.substr(1))} to the tarball`,
      );
      log.debug(err.stack);
      throw new NestError("Unable to append file to the tarball (publish)");
    }
  }

  /** Step 2 - send the config and uuid to the api */
  // TODO

  const response = await stageModule(meta, uuid);

  /** Step 3 - upload the tarball to arweave */
  // TODO

  const response_ = await publishModule(tar.getReader());

  /** Step 4 - do the twig magic locally */
  // TODO
}
