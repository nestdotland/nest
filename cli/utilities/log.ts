import {
  bold,
  cyan,
  ensureDir,
  gray,
  join,
  red,
  stripColor,
  underline,
  yellow,
} from "../deps.ts";
import { NestCLIError } from "../error.ts";
import { version } from "../version.ts";
import { envHOMEDIR } from "./env.ts";

type logFunction = <T>(message: T, ...args: unknown[]) => T;
interface Logger {
  debug: logFunction;
  info: logFunction;
  plain: logFunction;
  warning: logFunction;
  error: logFunction;
  critical: logFunction;
}

export const prefix = {
  debug: bold(`${gray("debug ")}`),
  info: bold(`${cyan("i ")}`),
  plain: "",
  warning: bold(`${yellow("! ")}`),
  error: bold(`${red("! ")}`),
  critical: bold(`${red("critical ")}`),
};

export let mainRecord = "";

export enum LogLevel {
  debug,
  info,
  plain,
  warning,
  error,
  critical,
  quiet,
}

export const log: Logger = {
  debug: <T>(message: T) => message,
  info: <T>(message: T) => message,
  plain: <T>(message: T) => message,
  warning: <T>(message: T) => message,
  error: <T>(message: T) => message,
  critical: <T>(message: T) => message,
};

export function lineBreak() {
  console.log();
}

/** Underline & bold */
export function underlineBold(msg: string) {
  return underline(bold(msg));
}

/** Main record handler */
function logToMainRecord(prefix: string) {
  prefix = stripColor(prefix);
  return <T>(message: T, ...args: unknown[]) => {
    // TODO(oganexon): align messages with fprintf
    let msg = `${new Date().toISOString()} ${prefix}`;
    for (const arg of [message, ...args]) {
      if (arg === "") continue;
      msg += ` ${
        typeof arg === "string"
          ? stripColor(arg)
          : Deno.inspect(arg, { depth: Infinity, iterableLimit: Infinity })
      }`;
    }
    mainRecord += msg + "\n";
    return message;
  };
}

/** Console handler */
function logToConsole(prefix: string, logLevel: LogLevel) {
  return <T>(message: T, ...args: unknown[]) => {
    let msg = prefix;
    for (const arg of [message, ...args]) {
      if (arg === "") continue;
      msg += `${
        typeof arg === "string"
          ? arg
          : Deno.inspect(arg, { depth: 10, colors: true })
      } `;
    }
    if (logLevel <= LogLevel.warning) {
      console.info(msg);
    } else {
      console.error(msg);
    }
    return message;
  };
}

/** Same as `setupLog`. Accepts string instead of enum. */
export function setupLogLevel(logLevel?: string) {
  if (logLevel === undefined) {
    setupLog();
  } else if (logLevel in LogLevel) {
    setupLog(LogLevel[logLevel as keyof typeof LogLevel]);
  } else {
    log.error(`Invalid log level: ${logLevel}`);
    log.info(
      `Allowed log levels:`,
      Object.keys(LogLevel).filter((level) =>
        Number.isNaN(Number.parseInt(level))
      ),
    );
    throw new NestCLIError("Invalid value (log level)");
  }
}

/** Setup the log handlers: console & main record.
 * Default log level is `info`. */
export function setupLog(logLevel = LogLevel.info) {
  for (const l in log) {
    const level = l as keyof typeof log;
    log[level] = logToMainRecord(level);
    if (logLevel <= LogLevel[level]) {
      const logMainRecord = log[level];
      const logConsole = logToConsole(prefix[level], logLevel);
      log[level] = <T>(message: T, ...args: unknown[]) => {
        logMainRecord(message, ...args);
        logConsole(message, ...args);
        return message;
      };
    }
  }
}

/** Writes the contents of the main record to `logFile`.
 * Defaults to `./nest-debug.log`. */
export async function writeLogFile(logFile?: string, wd = Deno.cwd()) {
  const encoder = new TextEncoder();

  const args = `Arguments:\n  ${Deno.args}\n\n`;
  const denoVersion =
    `Deno version:\n  deno: ${Deno.version.deno}\n  v8: ${Deno.version.v8}\n  typescript: ${Deno.version.typescript}\n\n`;
  const eggsVersion = `Nest CLI version:\n  ${version}\n\n`;
  const platform = `Platform:\n  ${Deno.build.target}\n\n`;

  if (logFile) {
    logFile = join(wd, logFile);
  } else {
    const logDir = join(envHOMEDIR(), ".nest/logs");
    await ensureDir(logDir);
    logFile = join(
      logDir,
      `${new Date().toISOString().replace(/[.:]/g, "_")}-debug.log`,
    );
  }

  await Deno.writeFile(
    logFile,
    encoder.encode(
      args +
        denoVersion +
        eggsVersion +
        platform +
        mainRecord,
    ),
  );

  log.info(
    `Debug file created. (${underlineBold(logFile)})`,
  );
}

/** Called when an unexpected error is thrown anywhere in the code.
 * A debug file is created. */
export async function handleError(err: Error, logFile?: string) {
  log.critical(`An unexpected error occurred: "${err.message}"`);
  log.debug(err.stack);
  await writeLogFile(logFile);
  log.info(
    `If you think this is a bug, please open a bug report at ${
      underlineBold("https://github.com/nestdotland/cli/issues/new/choose")
    }.`,
  );
  log.info(
    `Visit ${
      underlineBold("https://docs.nest.land/nest/")
    } for documentation about this command.`,
  );
}
