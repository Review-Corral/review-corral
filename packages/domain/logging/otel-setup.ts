import { logs } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { Resource as SSTResource } from "sst";
import config from "../utils/config";

let initialized = false;
let loggerProvider: LoggerProvider | undefined;
let shutdownPromise: Promise<void> | undefined;

const FLUSH_TIMEOUT_MS = 1_500;
const SHUTDOWN_TIMEOUT_MS = 3_000;

function buildPostHogLogsUrl(host: string): string {
  const trimmedHost = host.trim().replace(/\/+$/, "");
  if (!trimmedHost) {
    throw new Error("POSTHOG_HOST is empty");
  }

  if (/\/i\/v1\/logs$/i.test(trimmedHost)) {
    return trimmedHost;
  }

  if (/\/v1\/logs$/i.test(trimmedHost)) {
    return trimmedHost.replace(/\/v1\/logs$/i, "/i/v1/logs");
  }

  return new URL("/i/v1/logs", trimmedHost).toString();
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timed out during ${operation} after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}

export function initOTel(): boolean {
  if (initialized) return !!loggerProvider;
  initialized = true;

  if (config.isLocal) return false;

  try {
    const host = (SSTResource as any).POSTHOG_HOST.value as string;
    const apiKey = (SSTResource as any).POSTHOG_KEY.value as string;
    const url = buildPostHogLogsUrl(host);

    if (apiKey.startsWith("phx_")) {
      console.error(
        "OpenTelemetry logging is configured with a PostHog personal API key. Use the project token (phc_...) instead.",
      );
    }

    const exporter = new OTLPLogExporter({
      url,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const serviceName = `${config.appName}.${config.functionName}`;

    loggerProvider = new LoggerProvider({
      resource: new Resource({
        [ATTR_SERVICE_NAME]: serviceName,
      }),
    });
    loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(exporter));
    logs.setGlobalLoggerProvider(loggerProvider);

    process.on("beforeExit", async () => {
      try {
        await shutdownOTel();
      } catch (error) {
        console.error("Failed to shut down OpenTelemetry logging during process exit", error);
      }
    });

    return true;
  } catch (error) {
    console.error("Failed to initialize OpenTelemetry logging", error);
    loggerProvider = undefined;
    return false;
  }
}

export async function flushOTel(): Promise<void> {
  if (!loggerProvider) return;

  try {
    await withTimeout(loggerProvider.forceFlush(), FLUSH_TIMEOUT_MS, "OpenTelemetry force flush");
  } catch (error) {
    console.error("Failed to flush OpenTelemetry logs", error);
  }
}

export async function shutdownOTel(): Promise<void> {
  if (!loggerProvider) return;
  if (shutdownPromise) return shutdownPromise;

  shutdownPromise = (async () => {
    try {
      await withTimeout(loggerProvider.shutdown(), SHUTDOWN_TIMEOUT_MS, "OpenTelemetry shutdown");
    } finally {
      loggerProvider = undefined;
      shutdownPromise = undefined;
    }
  })();

  await shutdownPromise;
}
