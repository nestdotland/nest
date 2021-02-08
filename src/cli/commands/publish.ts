import {
  bold,
  cyan,
  delay,
  dim,
  gray,
  green,
  join,
  parse,
  red,
  semver,
  underline,
} from "../deps.ts";
import { NestCLIError } from "../utils/error.ts";
import { aliasesFromOptions, limitArgs, limitOptions } from "../utils/cli.ts";
import { setupCheckType } from "../processing/check_type.ts";
import { getHooks } from "../config/hooks.ts";
import { mainCommand, mainOptions } from "./main.ts";
import { lineBreak, log } from "../utils/log.ts";
import { resolveVersion } from "../processing/version.ts";
import { confirm } from "../utils/interact.ts";
import { publish as directPublish } from "../../mod/publish.ts";
import { prettyBytes } from "../utils/number.ts";
import * as config from "../config/config.ts";

import type { Args, Command, Option } from "../utils/types.ts";

interface Flags {
  yes?: boolean;
  dryRun?: boolean;
  gitTag?: boolean;
  pre?: boolean | string;
  deno?: string;
  version?: string;
  wallet?: string;
  unlisted?: boolean;
}

const options: Option[] = [
  ...mainOptions,
  {
    flag: "-Y, --yes",
    description: "Disable confirmation prompts",
  },
  {
    flag: "-d, --dry-run",
    description:
      "No changes will actually be made, reports the details of what would have been published",
  },
  {
    flag: "-g, --git-tag",
    description:
      "Use the latest git tag as version (ignored if <version> is provided)",
  },
  {
    flag: "--pre",
    argument: "[tag]",
    description: "Publish as a prerelease with optional identifier",
  },
  {
    flag: "--deno",
    argument: "<semver>",
    description: "Semver range for supported deno versions",
  },
  {
    flag: "-w, --wallet",
    argument: "<path>",
    description: "Path to custom arweave wallet",
  },
  {
    flag: "--unlisted",
    description: "Publish as an unlisted version",
  },
];

export const publishCommand: Command = {
  name: "publish",
  description: "Publish your module to the nest.land registry",
  arguments: [{
    name: "[version]",
    description: `semver tag or one of ${cyan("major")}, ${cyan("minor")}, ${
      cyan("patch")
    } (default: ${cyan("patch")})`,
  }],
  options,
  subCommands: new Map(),
  action,
};

mainCommand.subCommands.set(publishCommand.name, publishCommand);

export async function action(args = Deno.args) {
  const flags = assertFlags(parse(
    args,
    { alias: aliasesFromOptions(options) },
  ));

  const hooks = await getHooks();

  await hooks.publish(() => publish(flags));
}

function assertFlags(args: Args): Flags {
  const {
    _: [version, ...remainingArgs],
    yes,
    "dry-run": dryRun,
    "git-tag": gitTag,
    pre,
    deno,
    wallet,
    unlisted,
    ...remainingOptions
  } = args;

  limitOptions(remainingOptions, options);
  limitArgs(remainingArgs);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("--yes", yes, ["boolean"]);
  checkType("--dry-run", dryRun, ["boolean"]);
  checkType("--git-tag", gitTag, ["boolean"]);
  checkType("--pre", pre, ["string", "boolean"]);
  checkType("--deno", deno, ["string"]);
  checkType("--wallet", wallet, ["string", "number"]);
  checkType("--unlisted", unlisted, ["boolean"]);
  checkType("[version]", version, ["string", "number"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return {
    version: version && `${version}`,
    yes,
    dryRun,
    gitTag,
    pre,
    deno,
    wallet: wallet && `${wallet}`,
    unlisted,
  } as Flags;
}

// **************** logic ****************

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
  }: Flags,
): Promise<void> {
  const user = await config.users.getActive();
  const project = await config.project.parse();
  const files = await config.ignore.parse();

  log.info("Found", files.length, "files.");

  const version = await resolveVersion(
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

  // TODO: config status
  const configUpToDate = true;

  if (!configUpToDate) {
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
