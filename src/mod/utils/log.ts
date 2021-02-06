type logFunction = <T>(message: T, ...args: unknown[]) => T;

interface Logger {
  debug: logFunction;
  info: logFunction;
  plain: logFunction;
  warning: logFunction;
  error: logFunction;
  critical: logFunction;
}

export const log: Logger = {
  debug: <T>(message: T) => message,
  info: <T>(message: T) => message,
  plain: <T>(message: T) => message,
  warning: <T>(message: T) => message,
  error: <T>(message: T) => message,
  critical: <T>(message: T) => message,
};

export let lineBreak = () => {};

export function setupLineBreak() {
  lineBreak = console.log;
}
