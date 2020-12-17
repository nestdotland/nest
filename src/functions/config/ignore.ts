import { exists, join, readLines } from "../../deps.ts";
import { log } from "../../utilities/log.ts";
import { NestError } from "../../error.ts";
import { underlineBold } from "../../utilities/string.ts";
import { NEST_DIRECTORY } from "./nest.ts";

export const IGNORE_FILE = "ignore";
export const IGNORE_PATH = join(NEST_DIRECTORY, IGNORE_FILE);

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export function ignoreExists() {
  return exists(IGNORE_PATH);
}

export async function readIgnore(path = IGNORE_PATH): Promise<string> {
  const fileExists = await exists(path);

  if (!fileExists) {
    log.error(`File not found: ${underlineBold(path)}`);
    throw new NestError("File not found (ignore)");
  }

  const content = decoder.decode(await Deno.readFile(path));

  return path.match(/.gitignore$/) ? `${content}\n.git*/**` : content;
}

export async function writeIgnore(
  text: string,
  path = IGNORE_PATH,
): Promise<void> {
  await Deno.writeFile(path, encoder.encode(text));
}
