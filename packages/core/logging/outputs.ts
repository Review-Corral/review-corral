import * as fs from "fs";
import { WriteStream } from "fs";
import * as path from "path";
import { colorize, inspect } from "./helpers";
import { Color, LogLevel, LogOutput, LogOutputOptions } from "./types";

export const LOG_LEVEL_COLORS: Record<LogLevel, Color[]> = {
  [LogLevel.TRACE]: [],
  [LogLevel.DEBUG]: [],
  [LogLevel.INFO]: [],
  [LogLevel.WARN]: [Color.YELLOW],
  [LogLevel.ERROR]: [Color.RED],
};

export class ConsoleOutput implements LogOutput {
  constructor(private colorize: boolean) {}

  log(
    level: LogLevel,
    text: string,
    data: any,
    options: LogOutputOptions = { depth: 2 },
  ): void {
    const colors = this.colorize ? LOG_LEVEL_COLORS[level] : [];
    const colorizedTextWithData =
      `${colorize(text, colors)}` +
      `${data ? `\n${serializeData(data, this.colorize, options.depth)}` : ""}`;
    console[level](colorizedTextWithData);
  }
}

export class FileOutput implements LogOutput {
  private outputStream: WriteStream;

  constructor(filepath: string) {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.outputStream = fs.createWriteStream(filepath, {
      flags: "w",
      autoClose: false,
    });
  }

  log(
    level: LogLevel,
    text: string,
    data: any,
    options: LogOutputOptions = { depth: 2 },
  ): void {
    const textWithData = `${text}${
      data ? `\n${serializeData(data, false, options.depth)}` : ""
    }`;
    this.outputStream.write(`${textWithData}\n`, (err) => {
      if (err) console.error("Failed to write log:", err);
    });
  }
}

export class NullOutput implements LogOutput {
  log(): void {
    return;
  }
}

export const serializeData = (
  data: any,
  colorize: boolean,
  depth: number | null = 2,
): string => {
  if (typeof data === "string") return data;
  return inspect(data, { colors: colorize, depth })
    .replaceAll("\n", "\n  ")
    .replace(/^/, "  ");
};
