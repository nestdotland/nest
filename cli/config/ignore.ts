import { ensureFile, exists, join } from "../deps.ts";
import { NEST_DIRECTORY } from "./nest.ts";
import { Ignore } from "../processing/ignore.ts";

export const IGNORE_FILE = "ignore";
export const IGNORE_PATH = join(NEST_DIRECTORY, IGNORE_FILE);

const encoder = new TextEncoder();

export function ignoreExists(): Promise<boolean> {
  return exists(IGNORE_PATH);
}

/** Reads the `ignore` file.  */
export function readIgnore(): Promise<string> {
  return Deno.readTextFile(IGNORE_PATH);
}

/** Reads and parses the `ignore` file.  */
export function parseIgnore(path = IGNORE_PATH): Promise<string[]> {
  const ignore = new Ignore(path);

  return ignore.matchFiles();
}

export async function writeIgnore(
  text: string,
  path = IGNORE_PATH,
): Promise<void> {
  await Deno.writeFile(path, encoder.encode(text));
}
