import type { Meta } from "../utilities/types.ts";

export function downloadMeta(): Promise<Meta> {
  // TODO
  return Promise.resolve({ name: "" });
}

export function uploadMeta(meta: Meta, token: string): Promise<void> {
  // TODO
  return Promise.resolve();
}
