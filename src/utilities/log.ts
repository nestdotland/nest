import { blue, bold, gray, path, red, stripColor, yellow } from "../../deps.ts";
import { CLIError } from "../error.ts";
import { version } from "../version.ts";
import { highlight } from "./fmt.ts";

type logFunction = <T>(message: T, ...args: unknown[]) => T;
interface Logger {
  debug: logFunction;
  info: logFunction;
  warning: logFunction;
  error: logFunction;
  critical: logFunction;
}

const prefix = {
  debug: bold(`${gray("debug")}`),
  info: bold(`${blue("info")}`),
  noPrefix: "",
  warning: bold(`${yellow("warn")}`),
  error: bold(`${red("error")}`),
  critical: bold(`${red("CRITICAL")}`),
};

export let mainRecord = "";

export enum LogLevel {
  debug,
  info,
  warning,
  error,
  critical,
  quiet,
}

export const log: Logger = {
  debug: <T>(message: T) => message,
  info: <T>(message: T) => message,
  warning: <T>(message: T) => message,
  error: <T>(message: T) => message,
  critical: <T>(message: T) => message,
};

function logToMainRecord(prefix: string) {
  prefix = stripColor(prefix);
  return <T>(message: T, ...args: unknown[]) => {
    let msg = `${new Date().toISOString()} ${prefix}`;
    for (const arg of [message, ...args]) {
      msg += ` ${
        typeof arg === "string"
          ? arg
          : Deno.inspect(arg, { depth: Infinity, iterableLimit: Infinity })
      }`;
    }
    mainRecord += msg + "\n";
    return message;
  };
}

function logToConsole(prefix: string, logLevel: LogLevel) {
  return <T>(message: T, ...args: unknown[]) => {
    let msg = prefix;
    for (const arg of [message, ...args]) {
      msg += ` ${
        typeof arg === "string"
          ? arg
          : Deno.inspect(arg, { depth: 10, colors: true })
      }`;
    }
    if (logLevel <= LogLevel.warning) {
      console.info(msg);
    } else {
      console.error(msg);
    }
    return message;
  };
}

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
    throw new CLIError("Invalid value (log level)");
  }
}

export function setupLog(logLevel = LogLevel.info) {
  log.debug = logToMainRecord(prefix.debug);
  log.info = logToMainRecord(prefix.info);
  log.warning = logToMainRecord(prefix.warning);
  log.error = logToMainRecord(prefix.error);
  log.critical = logToMainRecord(prefix.critical);

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
    const logMainRecord = log.info;
    const logConsole = logToConsole(prefix.info, logLevel);
    log.info = <T>(message: T, ...args: unknown[]) => {
      logMainRecord(message, ...args);
      logConsole(message, ...args);
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

export async function writeLogFile(logFile: string) {
  const encoder = new TextEncoder();

  const args = `Arguments:\n  ${Deno.args}\n\n`;
  const denoVersion =
    `Deno version:\n  deno: ${Deno.version.deno}\n  v8: ${Deno.version.v8}\n  typescript: ${Deno.version.typescript}\n\n`;
  const eggsVersion = `Eggs version:\n  ${version}\n\n`;
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
    `Debug file created. (${highlight(path.join(Deno.cwd(), logFile))})`,
  );
}

export async function handleError(err: Error) {
  const DEBUG_LOG_FILE = "./eggs-debug.log";
  log.critical(`An unexpected error occurred: "${err.message}"`, err.stack);
  await writeLogFile(DEBUG_LOG_FILE);
  log.info(
    `If you think this is a bug, please open a bug report at ${
      highlight("https://github.com/nestdotland/nest/issues/new/choose")
    }.`,
  );
  log.info(
    `Visit ${
      highlight("https://docs.nest.land/nest/")
    } for documentation about this command.`,
  );
}
