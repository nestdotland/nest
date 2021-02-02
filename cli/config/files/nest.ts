import { ensureDir } from "../../deps.ts";

export const PATH = ".nest";

export async function ensure() {
  await ensureDir(PATH);
}
