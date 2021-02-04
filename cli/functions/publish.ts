import {
  bold,
  cyan,
  delay,
  dim,
  gray,
  green,
  join,
  red,
  semver,
  underline,
} from "../deps.ts";
import { lineBreak, log, underlineBold } from "../utilities/log.ts";
import { getLatestTag, isGitRepository } from "../utilities/git.ts";
import { NestCLIError } from "../error.ts";
import { getActiveUser } from "./login.ts";
import { confirm } from "../utilities/interact.ts";
import { publish as directPublish } from "../../lib/publish.ts";
import { isConfigUpToDate } from "./sync.ts";
import * as config from "../config/config.ts";

export interface PublishOptions {
  yes?: boolean;
  dryRun?: boolean;
  gitTag?: boolean;
  pre?: boolean | string;
  deno?: string;
  version?: string;
  wallet?: string;
  unlisted?: boolean;
}

const MAX_BUNDLE_SIZE = 200;

/** Publish your module to the nest.land registry. */
export async function publish(
  {
    yes = false,
    dryRun = false,
    gitTag = false,
    pre = false,
    deno,
    version: rawVersion,
    wallet,
    unlisted,
  }: PublishOptions,
): Promise<void> {
  const user = await getActiveUser();
  const project = await config.project.parse();
  const files = await config.ignore.parse();

  log.info("Found", files.length, "files.");

  const version = await computeVersion(
    rawVersion ?? "patch",
    project.version,
    pre,
    rawVersion ? false : gitTag,
  );

  let range: semver.Range | undefined = undefined;

  if (deno) {
    if (semver.validRange(deno)) {
      range = new semver.Range(deno);
    } else {
      log.error(deno, "is not a valid semantic range.");
      throw new NestCLIError("Invalid range (publish)");
    }
  }

  // BUG(oganexon): Deno can get stuck here

  /* const wd = Deno.cwd();
  const fileSize = files.map((file) => Deno.stat(join(wd, file))); */

  // Deno.lstat can freeze so we need to timeout the function
  /* const settledFileSize = await Promise.allSettled(fileSize.map((p) => {
    return Promise.race([
      (async () => {
        const file = await p;
        return file.size;
      })(),
      (async () => {
        await delay(1000);
        return null;
      })(),
    ]);
  }));
  const totalSize = settledFileSize.reduce(
    (previous, current) =>
      previous + (current.status === "fulfilled" ? current.value ?? 0 : 0),
    0,
  ); */

  const filesToPublish = files.reduce(
    (previous, current, index) => {
      /* const fileSize = settledFileSize[index];
      const size = fileSize.status === "fulfilled"
        ? gray(dim(`(${prettyBytes(fileSize.value)})`))
        : red(`Error while computing file size: ${fileSize.reason}`); */
      return `${previous}\n     - ${dim(current)}  ${"" /* size */}`;
    },
    "Files to publish:",
  );
  log.info(filesToPublish);
  lineBreak();

  /* if (totalSize > MAX_BUNDLE_SIZE * 1e6 && !wallet) {
    log.warning(
      `Total ${
        underline("estimated")
      } file size exceed ${MAX_BUNDLE_SIZE}Mb. Use your wallet if greater.`,
    );
  } */

  if (!await isConfigUpToDate()) {
    log.warning(
      "Local config is not up to date. You should synchronize it by running",
      bold(green("nest sync")),
    );
  }

  log.info(
    `Resulting module: ${cyan(`${project.author}/${project.name}@${version}`)}`,
  );

  if (!yes) {
    const confirmation = await confirm("Proceed with publication ?", false);

    if (!confirmation) {
      log.info("Publish cancelled.");
      return;
    }
  }

  if (dryRun) return;

  await directPublish(
    {
      module: project,
      version,
      files,
      token: user.token,
      deno: range,
      wallet,
      unlisted,
    },
  );

  project.version = version.format();
  config.project.write(project);
}

export async function computeVersion(
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
      underlineBold(config.project.FILE),
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

function prettyBytes(n: number | null): string {
  if (n === null) return "unknown";
  const log = Math.floor(Math.log10(n) / 3);
  let suffix: string;
  switch (log) {
    case 0:
      suffix = "B";
      break;
    case 1:
      suffix = "kB";
      break;
    case 2:
      suffix = "MB";
      break;
    case 3:
      suffix = "GB";
      break;
    case 4:
      suffix = "PB";
      break;
    default:
      suffix = "?";
      break;
  }
  return (n / 10 ** (log * 3)).toPrecision(3) + suffix;
}
