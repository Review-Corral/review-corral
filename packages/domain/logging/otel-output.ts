import { SeverityNumber, logs } from "@opentelemetry/api-logs";
import { LogLevel, LogOutput, LogOutputOptions } from "./types";

const SEVERITY_MAP: Record<LogLevel, SeverityNumber> = {
  [LogLevel.TRACE]: SeverityNumber.TRACE,
  [LogLevel.DEBUG]: SeverityNumber.DEBUG,
  [LogLevel.INFO]: SeverityNumber.INFO,
  [LogLevel.WARN]: SeverityNumber.WARN,
  [LogLevel.ERROR]: SeverityNumber.ERROR,
};

function flattenAttributes(data: unknown): Record<string, string | number | boolean> {
  if (data == null) return {};
  if (typeof data !== "object") return { value: String(data) };

  const result: Record<string, string | number | boolean> = {};
  for (const [key, val] of Object.entries(data)) {
    if (
      typeof val === "string" ||
      typeof val === "number" ||
      typeof val === "boolean"
    ) {
      result[key] = val;
    } else {
      result[key] = JSON.stringify(val);
    }
  }
  return result;
}

export class OTelOutput implements LogOutput {
  log(level: LogLevel, text: string, data: any, _options?: LogOutputOptions): void {
    try {
      const logger = logs.getLogger("review-corral");
      logger.emit({
        severityNumber: SEVERITY_MAP[level],
        severityText: level.toUpperCase(),
        body: text,
        attributes: flattenAttributes(data),
      });
    } catch {
      // Silently swallow to avoid breaking application logging
    }
  }
}
