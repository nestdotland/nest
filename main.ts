import { parse } from "https://deno.land/std@0.74.0/flags/mod.ts";
import { log, LogLevel, setupLogLevel } from "./src/utilities/log.ts";
import { upgradeCommand } from "./src/commands/upgrade2.ts";

const aliases = {
  "h": "help",
  "L": "logLevel",
  "log-level": "logLevel",
  "l": "log",
};

const commands: Record<string, () => void> = {
  "publish": () => {},
  "upgrade": upgradeCommand,
};

const { _: [command], logLevel, help } = parse(Deno.args, { alias: aliases });

if (help) {
  console.log("< help placeholder >")
  Deno.exit(0)
}

if (logLevel !== undefined && typeof logLevel !== "string") {
  setupLogLevel();
  log.error(`Invalid log level: ${logLevel}`);
  log.info(
    `Allowed log levels:`,
    Object.keys(LogLevel).filter((level) =>
      Number.isNaN(Number.parseInt(level))
    )
  );
  Deno.exit(1);
}

setupLogLevel(logLevel);

if (command in commands) {
  await commands[command as keyof typeof commands]()
} else {
  log.error(`Unknown command: ${command}`);
  Deno.exit(2);
}
