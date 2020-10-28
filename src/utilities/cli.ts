import type { Option } from "./types.ts";
import { log } from "../utilities/log.ts";
import { CLIError } from "../error.ts";

export function aliasesFromOptions(options: Option[]) {
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
    }
  }

  return flags;
}

export function limitOptions(
  options: Record<string, unknown>,
  baseOptions: Option[],
) {
  const ignore = extractFlags(baseOptions);
  const delta = Object.keys(options).filter((flag) => !ignore.includes(flag));
  if (delta.length === 0) return;
  if (delta.length === 1) {
    log.error("Unknown option:", keyToOption(delta[0]));
  } else {
    log.error(
      "Unknown options:",
      delta.map((key) => keyToOption(key)).join(", "),
    );
  }
  throw new CLIError("Unknown options");
}

export function limitArgs(args: unknown[]) {
  if (args.length === 0) return;
  log.error("Too many arguments:", args.join(", "));
  throw new CLIError("Too many arguments");
}
