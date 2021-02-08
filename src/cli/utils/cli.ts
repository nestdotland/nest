import { bold, underline } from "../deps.ts";
import { NestCLIError } from "../utils/error.ts";
import { log } from "../utils/log.ts";
import { likelyString } from "./string.ts";
import type { Option } from "./types.ts";

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

/** Transform a string into an option: a => -a, foo => --foo */
function keyToOption(key: string): string {
  return key.length === 1 ? `-${key}` : `--${key}`;
}

/** Returns a list of flags from options */
function extractFlags(options: Option[]): string[] {
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
      throw new NestCLIError("Malformed flag (extractFlags)");
    }
  }

  return flags;
}

/** Will throw if `options` is not empty. */
export function limitOptions(
  options: Record<string, unknown>,
  baseOptions: Option[],
): void {
  const reference = extractFlags(baseOptions);
  const misspelled = Object.keys(options).filter((flag) =>
    !reference.includes(flag)
  );
  if (misspelled.length === 0) return;
  log.error(
    `Unknown option${misspelled.length === 1 ? "" : "s"}:`,
    misspelled.map((key) => underline(key)).join(", "),
  );
  didYouMean(reference, misspelled, keyToOption);
  throw new NestCLIError("Unknown options (limitOptions)");
}

/** Will throw if `fields` is not empty. */
export function limitFields(
  file: string,
  fields: Record<string, unknown>,
  reference: string[],
) {
  const misspelled = Object.keys(fields);
  if (misspelled.length === 0) return;
  log.error(
    bold(file),
    `Unknown field${misspelled.length === 1 ? "" : "s"} in config:`,
    misspelled.map((key) => underline(key)).join(", "),
  );
  didYouMean(reference, misspelled);
  throw new NestCLIError("Unknown fields (limitFields)");
}

/** Will throw if `args` is not empty. */
export function limitArgs(args: unknown[]) {
  if (args.length === 0) return;
  log.error("Too many arguments:", args.join(", "));
  throw new NestCLIError("Too many arguments (limitArgs)");
}

/** Displays most likely string from reference */
export function didYouMean(
  reference: string[],
  misspelled: string[],
  format = (likely: string) => likely,
): void {
  if (misspelled.length === 0) return;
  const likelyKeys = misspelled
    .map((value) => likelyString(value, reference))
    .filter((likely): likely is string => likely !== undefined);
  if (likelyKeys.length > 0) {
    log.plain(
      `\nDid you mean ${
        likelyKeys.map((likely) => bold(format(likely))).join(", ")
      } ?`,
    );
  }
}
