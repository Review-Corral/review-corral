import { Logger } from "@domain/logging";
import config from "@domain/utils/config";
import { Context, MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { format } from "date-fns";
import path from "node:path";

const LOGGER = new Logger("internalApi");

/**
 * Safely get the JSON body from a request
 */
const safeGetJsonBody = async (c: Context) => {
  try {
    if (["POST", "PUT", "PATCH"].includes(c.req.method)) {
      const contentType = c.req.header("content-type");
      if (contentType?.includes("application/json")) {
        // Clone to avoid consuming the body
        const clonedReq = c.req.raw.clone();
        const body = await clonedReq.json();
        return JSON.stringify(body);
      }
    }
  } catch (_e: unknown) {
    return null;
  }
  return null;
};

/**
 * Middleware for logging requests and responses
 */
export const loggerMiddleware: MiddlewareHandler = async (c, next) => {
  const requestId = c.req.header("x-request-id") || crypto.randomUUID();
  const clientIp = c.req.header("x-forwarded-for") || c.req.header("x-real-ip");

  // Get JSON body if available
  const jsonBody = await safeGetJsonBody(c);

  if (config.isLocal) {
    setupLocalLogger(c);
  }
  LOGGER.info("start request", {
    requestId,
    jsonBody,
    method: c.req.method,
    url: c.req.url,
    clientIp,
    contentType: c.req.header("content-type"),
    userAgent: c.req.header("user-agent"),
  });

  try {
    await next();
  } catch (error) {
    // Log error but let it propagate for Hono's error handler to handle
    const statusCode = (error as HTTPException).status || 500;
    const loggerMethod = statusCode >= 500 ? "error" : "info";
    LOGGER[loggerMethod]("Error in API request", error);
    throw error; // Re-throw to let Hono handle it
  }

  LOGGER.info("end request", {
    requestId,
    status: c.res.status,
  });
  if (config.isLocal) {
    Logger.configureOutput();
  }
};

/**
 * Configure logger to write to a local file when running locally
 */
const setupLocalLogger = (c: Context) => {
  const nameParts = getLogFileNameParts(c);

  const filepath = createLogFilePath(nameParts);
  // Locally, SST runs from inside .sst/artifacts/FooHandler/ so exit from that
  const filepathAbsolute = path.resolve(`../../../${filepath}`);

  console.log(`  logfile: "${filepath}"`); // We don't need the prefix from LOGGER

  Logger.configureOutput(filepathAbsolute);
};

/**
 * Get log file name parts from the Hono context
 */
const getLogFileNameParts = (c: Context): string[] => {
  const path = c.req.path;
  const method = c.req.method;
  const routeKey = `${method}${path}`;
  return ["api", routeKey];
};

/**
 * Create a log file path based on function name parts
 */
export function createLogFilePath(nameParts: string[]): string {
  const now = new Date();
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  const folder = `logs/${format(localNow, "yyyy-MM-dd")}/${nameParts.join("/")}`;
  const timestamp = format(localNow, "HH-mm-ss-SSSS"); // Colons create invalid file paths
  return `${folder}/${timestamp}.log`;
}

/**
 * Converts a string to kebab-case
 */
export function toKebabCase(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[^a-z{}]+/gi, "-") // {} for components like {id} in API path
    .toLowerCase();
}
