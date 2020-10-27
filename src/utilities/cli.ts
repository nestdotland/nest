import type { Option } from "./types.ts";
import { log } from "../utilities/log.ts";
import { CLIError } from "../global/error.ts";

export function aliasesFromFlags(flags: Option[]) {
  const aliases: Record<string, string> = {};

  for (let i = 0; i < flags.length; i++) {
    const { flag } = flags[i];
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

export function limitOptions(options: Record<string, unknown>) {
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
  throw new CLIError("Unknown options");
}

export function limitArgs(args: unknown[]) {
  if (args.length === 0) return;
  log.error("Too many arguments:", args.join(", "));
  throw new CLIError("Too many arguments");
}
