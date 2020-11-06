import { log } from "./log.ts";
import { NestCLIError } from "../error.ts";

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

await getLatestTag();

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
