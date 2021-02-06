import {
  dirname,
  fromFileUrl,
  resolve,
} from "https://deno.land/std@0.82.0/path/mod.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
export const testRoot = resolve(__dirname, "../test");

export * from "https://x.nest.land/std@0.83.0/testing/bench.ts";
export * from "https://x.nest.land/std@0.83.0/testing/asserts.ts";
export * from "../deps.ts";
