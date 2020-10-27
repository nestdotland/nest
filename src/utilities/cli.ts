import { log } from "./log.ts";

export class OptionsError extends Error {
  name = "Options Error";
  constructor(public message: string) {
    super(message);
  }
}

function keyToOption(key: string): string {
  return key.length === 1 ? `-${key}` : `--${key}`;
}

export function noMoreOptions(options: Record<string, unknown>) {
  const keys = Object.keys(options);
  if (keys.length === 0) return;
  if (keys.length === 1) {
    log.error("Unknown option:", keyToOption(keys[0]));
  } else {
    log.error(
      "Unknown options:",
      keys.map((key) => keyToOption(key)).join(", "),
    );
  }
  throw new OptionsError("");
}

export function noMoreArgs(args: unknown[]) {
  if (args.length === 0) return;
  log.error("Too many arguments:", args.join(", "));
  throw new OptionsError("");
}
