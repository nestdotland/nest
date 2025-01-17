import { log } from "../utils/log.ts";
import type { Meta, Module } from "../utils/types.ts";

export function downloadConfig(
  module: Module,
): Promise<{ meta: Meta; ignore: string; lastSync: number }> {
  log.info("Downloading remote config...");
  // TODO
  return Promise.resolve({
    meta: {},
    ignore: ".*",
    lastSync: new Date().getTime() - 1000000,
  });
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
