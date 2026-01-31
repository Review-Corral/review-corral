import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { Resource } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
} from "@opentelemetry/semantic-conventions";
import { Resource as SSTResource } from "sst";
import config from "../utils/config";

let initialized = false;
let sdk: NodeSDK | undefined;

export function initOTel(): boolean {
  if (initialized) return !!sdk;
  initialized = true;

  if (config.isLocal) return false;

  try {
    const host = (SSTResource as any).POSTHOG_HOST.value as string;
    const apiKey = (SSTResource as any).POSTHOG_KEY.value as string;

    const exporter = new OTLPLogExporter({
      url: `${host}/v1/logs`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const serviceName =
      `${config.appName}.${config.functionName}`;

    sdk = new NodeSDK({
      resource: new Resource({
        [ATTR_SERVICE_NAME]: serviceName,
      }),
      logRecordProcessors: [
        new BatchLogRecordProcessor(exporter),
      ],
    });

    sdk.start();

    process.on("beforeExit", async () => {
      try {
        await sdk?.shutdown();
      } catch {
        // Best-effort flush
      }
    });

    return true;
  } catch {
    return false;
  }
}
