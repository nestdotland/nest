import { exists, join, readLines } from "../../deps.ts";
import { log } from "../../utilities/log.ts";
import { NestError } from "../../error.ts";
import { highlight } from "../../utilities/fmt.ts";
import { NEST_DIRECTORY } from "./nest.ts";

export const IGNORE_FILE = "module.json";
export const IGNORE_PATH = join(NEST_DIRECTORY, IGNORE_FILE);

export async function ignoreExists() {
  return await exists(IGNORE_PATH);
}

export async function readIgnore(path = IGNORE_PATH): Promise<string[]> {
  const fileExists = await exists(path);

  if (!fileExists) {
    log.error(`File not found: ${highlight(path)}`);
    throw new NestError("File not found (ignore)");
  }

  const lines: string[] = [];

  const file = await Deno.open(path);

  for await (const line of readLines(file)) {
    lines.push(line);
  }

  Deno.close(file.rid);

  if (path.match(/.gitignore$/)) lines.push(".git*/**");

  return lines;
}
