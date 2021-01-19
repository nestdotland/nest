import { blue, bold, underline } from "../deps.ts";
import { NestCLIError } from "../error.ts";
import { log } from "../utilities/log.ts";
import { likelyString } from "./string.ts";
import type { Option, RawObject } from "./types.ts";

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
      throw new NestCLIError("Malformed flag (extractFlags)");
    }
  }

  return flags;
}

/** Will throw if `options` is not empty. */
export function limitOptions(
  options: RawObject,
  baseOptions: Option[],
) {
  const reference = extractFlags(baseOptions);
  const misspelled = Object.keys(options).filter((flag) =>
    !reference.includes(flag)
  );
  if (misspelled.length === 0) return;
  log.error(
    `Unknown option${misspelled.length === 1 ? "" : "s"} in config:`,
    misspelled.map((key) => underline(key)).join(", "),
  );
  didYouMean(reference, misspelled, keyToOption);
  throw new NestCLIError("Unknown options (limitOptions)");
}

/** Will throw if `fields` is not empty. */
export function limitFields(
  file: string,
  fields: RawObject,
  baseFields: RawObject = {},
) {
  const misspelled = Object.keys(fields);
  const reference = Object.keys(baseFields);
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

type TypeOf = "boolean" | "string" | "number" | "object" | "array";

export function setupCheckType(file = "") {
  file = file ? bold(file) : "";
  let wrongType = false;
  return {
    checkType(
      name: string,
      value: unknown,
      type: TypeOf[],
      required = false,
    ) {
      if (
        type.reduce(
          (previous: boolean, current: TypeOf) =>
            previous && current === "array"
              ? !Array.isArray(value)
              : typeof value !== current,
          true,
        ) && (required ? value === undefined : value !== undefined)
      ) {
        log.error(
          file ? `${file}:` : "",
          underline(name),
          `should be of type ${blue(type.join(" or "))}. Received`,
          value,
        );
        wrongType = true;
      }
    },
    typeError() {
      return wrongType;
    },
  };
}
