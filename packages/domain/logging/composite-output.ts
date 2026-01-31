import { LogLevel, LogOutput, LogOutputOptions } from "./types";

export class CompositeOutput implements LogOutput {
  constructor(private readonly outputs: LogOutput[]) {}

  log(
    level: LogLevel,
    text: string,
    data: any,
    options?: LogOutputOptions,
  ): void {
    for (const output of this.outputs) {
      output.log(level, text, data, options);
    }
  }
}
