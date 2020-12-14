import { join, readLines } from "../../deps.ts";
import { NEST_DIRECTORY } from "./nest.ts";

export const IGNORE_FILE = "module.json";
export const IGNORE_PATH = join(NEST_DIRECTORY, IGNORE_FILE);

export async function readIgnore(path = IGNORE_PATH): Promise<string[]> {
  const lines: string[] = [];

  const file = await Deno.open(path);

  for await (const line of readLines(file)) {
    lines.push(line);
  }

  Deno.close(file.rid);

  if (path.match(/.gitignore$/)) lines.push(".git*/**");

  return lines;
}
