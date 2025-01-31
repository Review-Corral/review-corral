export enum LogLevel {
  TRACE = "trace",
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}
export enum Color {
  RED = "\x1b[91m",
  GREEN = "\x1b[32m",
  YELLOW = "\x1b[33m",
  RESET = "\x1b[0m",
}

export interface LogOutputOptions {
  depth?: number;
}

export interface LogOutput {
  log(level: LogLevel, text: string, data: any, options?: LogOutputOptions): void;
}

export type LoggerMethods = {
  [K in LogLevel]: (message: string) => void;
};
