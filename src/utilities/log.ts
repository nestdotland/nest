import {
  blue,
  bold,
  gray,
  path,
  red,
  stripColor,
  underline,
  yellow,
} from "../../cli_deps.ts";
import { version } from "../version.ts";

type logFunction = <T>(message?: T | undefined, ...args: unknown[]) => T;
interface Logger {
  debug: logFunction;
  info: logFunction;
  warning: logFunction;
  error: logFunction;
  critical: logFunction;
}

const prefix = {
  debug: bold(`${gray("debug")}:`),
  info: bold(`${blue("info")}:`),
  warning: bold(`${yellow("warn")}:`),
  error: bold(`${red("error")}:`),
  critical: bold(`${red("CRITICAL")}:`),
};

export let mainRecord = "";
export let errorOccurred = false;

export enum LogLevel {
  debug,
  info,
  warning,
  error,
  critical,
}

export const log: Logger = {
  debug: (message?: any) => message,
  info: (message?: any) => message,
  warning: (message?: any) => message,
  error: (message?: any) => message,
  critical: (message?: any) => message,
};

function logToMainRecord(prefix: string) {
  prefix = stripColor(prefix);
  return (message: any, ...args: unknown[]) => {
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
  return (message?: any, ...args: unknown[]) => {
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
  if (logLevel === undefined || logLevel in LogLevel) {
    // ? Can we handle enums in a better way ?
    setupLog(<unknown>logLevel as LogLevel)
  } else {
    throw new Error(`Invalid log level: ${logLevel}`)
  }
}

export function setupLog(logLevel = LogLevel.info) {
  log.debug = logToMainRecord(prefix.debug);
  log.info = logToMainRecord(prefix.info);
  log.warning = logToMainRecord(prefix.warning);
  log.error = logToMainRecord(prefix.error);
  log.critical = logToMainRecord(prefix.critical);

  switch (logLevel) {
    case LogLevel.debug: {
      const logMainRecord = log.debug;
      const logConsole = logToConsole(prefix.debug, logLevel);
      log.debug = (message?: any, ...args: unknown[]) => {
        logMainRecord(message, ...args);
        logConsole(message, ...args);
        return message;
      };
    }
    case LogLevel.info: {
      const logMainRecord = log.info;
      const logConsole = logToConsole(prefix.info, logLevel);
      log.info = (message?: any, ...args: unknown[]) => {
        logMainRecord(message, ...args);
        logConsole(message, ...args);
        return message;
      };
    }
    case LogLevel.warning: {
      const logMainRecord = log.warning;
      const logConsole = logToConsole(prefix.warning, logLevel);
      log.warning = (message?: any, ...args: unknown[]) => {
        logMainRecord(message, ...args);
        logConsole(message, ...args);
        return message;
      };
    }
    case LogLevel.error: {
      const logMainRecord = log.error;
      const logConsole = logToConsole(prefix.error, logLevel);
      log.error = (message?: any, ...args: unknown[]) => {
        errorOccurred = true;
        logMainRecord(message, ...args);
        logConsole(message, ...args);
        return message;
      };
    }
    case LogLevel.critical:
      {
        const logMainRecord = log.critical;
        const logConsole = logToConsole(prefix.critical, logLevel);
        log.critical = (message?: any, ...args: unknown[]) => {
          errorOccurred = true;
          logMainRecord(message, ...args);
          logConsole(message, ...args);
          return message;
        };
      }
      break;
    default:
      console.error("Unknown log level:", logLevel);
      break;
  }
}

export async function writeLogFile(logFile = "./eggs-debug.log") {
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

export function highlight(msg: string) {
  return underline(bold(msg));
}
