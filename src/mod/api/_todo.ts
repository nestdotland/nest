import type { Meta, Module } from "../utils/types.ts";

export function downloadConfig(
  module: Module,
): Promise<{ meta: Meta; ignore: string }> {
  // TODO
  return Promise.resolve({ meta: {}, ignore: ".*" });
}

export function uploadConfig(
  module: Module,
  meta: Meta,
  ignore: string,
  token: string,
): Promise<void> {
  // TODO
  return Promise.resolve();
}
