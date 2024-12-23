import { ConsoleOutput, FileOutput } from "./outputs";
import { LogLevel, LogOutput, LogOutputOptions, LoggerMethods } from "./types";

const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  [LogLevel.TRACE]: 10,
  [LogLevel.DEBUG]: 20,
  [LogLevel.INFO]: 30,
  [LogLevel.WARN]: 40,
  [LogLevel.ERROR]: 50,
};

const DEFAULT_LOG_OUTPUT_OPTIONS: LogOutputOptions = {
  depth: 2,
};

export class Logger implements LoggerMethods {
  private static readonly level: LogLevel = LogLevel.DEBUG;
  public static readonly colorize: boolean = !!process.env.COLORIZE_LOGS;
  private static logOutput: LogOutput = new ConsoleOutput(Logger.colorize);

  private readonly names: string[] = [];
  private readonly logOutputOverride?: LogOutput;

  // If this is set to true, then DEBUG log events will be emitted, even if the
  // LOG_LEVEL is set to a higher level.
  // Useful for log intense parts of our code that are only useful to be logged when
  // debugging that specific part of the code but we want to refrain from extremely
  // verbose logging otherwise.
  private readonly forceEmitDebugLogs: boolean;

  constructor(
    name: string,
    {
      logOutputOverride,
      forceEmitDebugLogs,
    }: { logOutputOverride?: LogOutput; forceEmitDebugLogs?: boolean } = {},
  ) {
    this.names = [name];
    this.logOutputOverride = logOutputOverride;
    this.forceEmitDebugLogs = forceEmitDebugLogs ?? false;
  }

  public static configureOutput(filepath?: string): void {
    Logger.logOutput = filepath
      ? new FileOutput(filepath)
      : new ConsoleOutput(Logger.colorize);
  }

  public static setLogOutput(logOutput: LogOutput): void {
    Logger.logOutput = logOutput;
  }

  private log(
    level: LogLevel,
    message: string,
    data?: any,
    options: LogOutputOptions = DEFAULT_LOG_OUTPUT_OPTIONS,
  ) {
    if (!this.shouldBeLogged(level)) return;
    const text = `${this.formatPrefix(level)} ${message}`;
    (this.logOutputOverride ?? Logger.logOutput).log(level, text, data, options);
  }

  public trace(
    message: string,
    data?: any,
    options: LogOutputOptions = DEFAULT_LOG_OUTPUT_OPTIONS,
  ) {
    this.log(LogLevel.TRACE, message, data, options);
  }

  public debug(
    message: string,
    data?: any,
    options: LogOutputOptions = DEFAULT_LOG_OUTPUT_OPTIONS,
  ) {
    this.log(LogLevel.DEBUG, message, data, options);
  }

  public info(
    message: string,
    data?: any,
    options: LogOutputOptions = DEFAULT_LOG_OUTPUT_OPTIONS,
  ) {
    this.log(LogLevel.INFO, message, data, options);
  }

  public warn(
    message: string,
    data?: any,
    options: LogOutputOptions = DEFAULT_LOG_OUTPUT_OPTIONS,
  ) {
    this.log(LogLevel.WARN, message, data, options);
  }

  /**
   * Log an error to Sentry and the console
   *
   * @param message A message describing the error
   * @param errorOrData Either an Error or some extra data to log
   * @param data Additional data to log (e.g. if errorOrData is an Error)
   */
  public error(
    message: string,
    errorOrData?: any,
    options: LogOutputOptions = DEFAULT_LOG_OUTPUT_OPTIONS,
  ): void {
    this.log(LogLevel.ERROR, message, errorOrData, options);
  }

  private formatPrefix(level: LogLevel): string {
    return `[${level.toUpperCase()}] (${this.names.join(".")})`;
  }

  private shouldBeLogged(level: LogLevel): boolean {
    if (this.forceEmitDebugLogs && level === LogLevel.DEBUG) {
      return true;
    }

    return LOG_LEVEL_SEVERITY[level] >= LOG_LEVEL_SEVERITY[Logger.level];
  }
}
