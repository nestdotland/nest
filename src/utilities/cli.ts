import type { Option } from "./types.ts";
import { log } from "../utilities/log.ts";
import { NestCLIError } from "../error.ts";
import { likelyString } from "./levenshtein.ts";

/** Generates aliases from options for the `parse` function. */
export function aliasesFromOptions(options: Option[]): Record<string, string> {
  const aliases: Record<string, string> = {};

  for (let i = 0; i < options.length; i++) {
    const { flag } = options[i];
    if (flag.includes(", ")) {
      const [short, long] = flag.split(", ");
      aliases[short.substr(1)] = long.substr(2);
    }
  }

  return aliases;
}

function keyToOption(key: string): string {
  return key.length === 1 ? `-${key}` : `--${key}`;
}

function extractFlags(options: Option[]) {
  const flags: string[] = [];

  for (let i = 0; i < options.length; i++) {
    const { flag } = options[i];
    if (flag.includes(", ")) {
      const [short, long] = flag.split(", ");
      flags.push(short.substr(1));
      flags.push(long.substr(2));
    } else if (flag.startsWith("--")) {
      flags.push(flag.substr(2));
    } else if (flag.startsWith("-")) {
      flags.push(flag.substr(1));
    } else {
      log.error("Malformed flag:", flag);
      throw new Error("Malformed flag");
    }
  }

  return flags;
}

/** Will throw if `options` is not empty. */
export function limitOptions(
  options: Record<string, unknown>,
  baseOptions: Option[],
) {
  const baseFlags = extractFlags(baseOptions);
  const delta = Object.keys(options).filter((flag) =>
    !baseFlags.includes(flag)
  );
  if (delta.length === 0) return;
  if (delta.length === 1) {
    const option = delta[0];
    log.error("Unknown option:", keyToOption(option));
    const likely = likelyString(option, baseFlags);
    if (likely) {
      log.plain(`Did you mean ${keyToOption(likely)} ?`);
    }
  } else {
    log.error(
      "Unknown options:",
      delta.map((key) => keyToOption(key)).join(", "),
    );
    const likelyKeys = delta
      .map((option) => likelyString(option, baseFlags))
      .filter((option): option is string => option !== undefined);
    if (likelyKeys.length > 0) {
      log.plain(
        `Did you mean ${
          likelyKeys.map((key) => keyToOption(key)).join(", ")
        } ?`,
      );
    }
  }
  throw new NestCLIError("Unknown options");
}

/** Will throw if `args` is not empty. */
export function limitArgs(args: unknown[]) {
  if (args.length === 0) return;
  log.error("Too many arguments:", args.join(", "));
  throw new NestCLIError("Too many arguments");
}
