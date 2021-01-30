import { ensureDir } from "../deps.ts";

export const NEST_DIRECTORY = ".nest";

export async function ensureNestDir() {
  await ensureDir(NEST_DIRECTORY);
}
