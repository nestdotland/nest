import { ensureFile } from "../deps.ts";
import { Ignore } from "../processing/ignore.ts";
import { log } from "./log.ts";
import { NestCLIError } from "./error.ts";

const encoder = new TextEncoder();

export async function isGitRepository(): Promise<string | false> {
  const process = Deno.run({
    cmd: ["git", "rev-parse", "--git-dir"],
    stderr: "piped",
    stdout: "piped",
  });

  const { status, stdout } = await resolveProcess(process);
  if (status.code !== 0) {
    return false;
  }
  return stdout;
}

export async function addToGitIgnore(lines: string[]) {
  if (await isGitRepository()) {
    await ensureFile(".gitignore");

    const ignore = new Ignore(".gitignore");
    await ignore.parsingProcess;

    for (const line of lines) {
      const patternInFile = ignore.denied.some((rgx) => rgx.test(line));
      if (!patternInFile) {
        await Deno.writeFile(
          ".gitignore",
          encoder.encode(line),
          { append: true },
        );
      }
    }
  }
}

export async function getLatestTag(): Promise<string> {
  const process = Deno.run({
    cmd: ["git", "rev-list", "--tags", "--max-count=1"],
    stderr: "piped",
    stdout: "piped",
  });

  const { status, stdout, stderr } = await resolveProcess(process);

  if (status.code !== 0) {
    log.error("Error while reading latest git tag.");
    log.plain(stderr);
    throw new NestCLIError("git rev-list returned a non zero code.");
  }

  return stdout.split("\n")[0];
}

export async function describeTag(tag: string): Promise<string> {
  const process = Deno.run({
    cmd: ["git", "describe", "--tags", tag],
    stderr: "piped",
    stdout: "piped",
  });

  const { status, stdout, stderr } = await resolveProcess(process);

  if (status.code !== 0) {
    log.error("Error while describing git tag.");
    log.plain(stderr);
    throw new NestCLIError("git describe returned a non zero code.");
  }

  return stdout.split("\n")[0];
}

async function resolveProcess(process: Deno.Process) {
  const status = await process.status();
  const stdout = new TextDecoder("utf-8").decode(await process.output());
  const stderr = new TextDecoder("utf-8").decode(
    await process.stderrOutput(),
  );
  process.close();
  return { status, stdout, stderr };
}
