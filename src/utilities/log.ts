import { bold, gray, green, join, red, stripColor, yellow } from "../deps.ts";
import { NestCLIError } from "../error.ts";
import { version } from "../version.ts";
import { underlineBold } from "./string.ts";

type logFunction = <T>(message: T, ...args: unknown[]) => T;
interface Logger {
  debug: logFunction;
  info: logFunction;
  plain: logFunction;
  warning: logFunction;
  error: logFunction;
  critical: logFunction;
}

const prefix = {
  debug: bold(`${gray("debug ")}`),
  info: bold(`${green("i ")}`),
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

/** Main record handler */
function logToMainRecord(prefix: string) {
  prefix = stripColor(prefix);
  return <T>(message: T, ...args: unknown[]) => {
    let msg = `${new Date().toISOString()} ${prefix}`;
    for (const arg of [message, ...args]) {
      if (arg === "") continue;
      msg += `${
        typeof arg === "string"
          ? stripColor(arg)
          : Deno.inspect(arg, { depth: Infinity, iterableLimit: Infinity })
      } `;
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

/**
 * Setup the log handlers: console & main record.
 * Default log level is `info`.
 */
export function setupLog(logLevel = LogLevel.info) {
  log.debug = logToMainRecord(prefix.debug);
  log.info = logToMainRecord(prefix.info);
  log.plain = logToMainRecord(prefix.plain);
  log.warning = logToMainRecord(prefix.warning);
  log.error = logToMainRecord(prefix.error);
  log.critical = logToMainRecord(prefix.critical);

  // TODO(oganexon): refactor this part

  if (logLevel <= LogLevel.debug) {
    const logMainRecord = log.debug;
    const logConsole = logToConsole(prefix.debug, logLevel);
    log.debug = <T>(message: T, ...args: unknown[]) => {
      logMainRecord(message, ...args);
      logConsole(message, ...args);
      return message;
    };
  }
  if (logLevel <= LogLevel.info) {
    const logMainRecordInfo = log.info;
    const logConsoleInfo = logToConsole(prefix.info, logLevel);
    log.info = <T>(message: T, ...args: unknown[]) => {
      logMainRecordInfo(message, ...args);
      logConsoleInfo(message, ...args);
      return message;
    };
    const logMainRecordPlain = log.plain;
    const logConsolePlain = logToConsole(prefix.plain, logLevel);
    log.plain = <T>(message: T, ...args: unknown[]) => {
      logMainRecordPlain(message, ...args);
      logConsolePlain(message, ...args);
      return message;
    };
  }
  if (logLevel <= LogLevel.warning) {
    const logMainRecord = log.warning;
    const logConsole = logToConsole(prefix.warning, logLevel);
    log.warning = <T>(message: T, ...args: unknown[]) => {
      logMainRecord(message, ...args);
      logConsole(message, ...args);
      return message;
    };
  }
  if (logLevel <= LogLevel.error) {
    const logMainRecord = log.error;
    const logConsole = logToConsole(prefix.error, logLevel);
    log.error = <T>(message: T, ...args: unknown[]) => {
      logMainRecord(message, ...args);
      logConsole(message, ...args);
      return message;
    };
  }
  if (logLevel <= LogLevel.critical) {
    const logMainRecord = log.critical;
    const logConsole = logToConsole(prefix.critical, logLevel);
    log.critical = <T>(message: T, ...args: unknown[]) => {
      logMainRecord(message, ...args);
      logConsole(message, ...args);
      return message;
    };
  }
}

/**
 * Writes the contents of the main record to `logFile`.
 * Defaults to `./nest-debug.log` .
 */
export async function writeLogFile(logFile = "./nest-debug.log") {
  const encoder = new TextEncoder();

  const args = `Arguments:\n  ${Deno.args}\n\n`;
  const denoVersion =
    `Deno version:\n  deno: ${Deno.version.deno}\n  v8: ${Deno.version.v8}\n  typescript: ${Deno.version.typescript}\n\n`;
  const eggsVersion = `Nest CLI version:\n  ${version}\n\n`;
  const platform = `Platform:\n  ${Deno.build.target}\n\n`;

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
    `Debug file created. (${underlineBold(join(Deno.cwd(), logFile))})`,
  );
}

/**
 * Called when an unexpected error is thrown anywhere in the code.
 * A debug file is created.
 */
export async function handleError(err: Error, logFile?: string) {
  log.critical(`An unexpected error occurred: "${err.message}"`);
  log.debug(err.stack);
  await writeLogFile(logFile);
  log.info(
    `If you think this is a bug, please open a bug report at ${
      underlineBold("https://github.com/nestdotland/nest/issues/new/choose")
    }.`,
  );
  log.info(
    `Visit ${
      underlineBold("https://docs.nest.land/nest/")
    } for documentation about this command.`,
  );
}
