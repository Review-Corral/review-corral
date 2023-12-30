import middy, { MiddlewareObj } from "@middy/core";
import jsonBodyParser from "@middy/http-json-body-parser";
import {
  APIGatewayEvent,
  APIGatewayProxyStructuredResultV2,
  Handler,
} from "aws-lambda";
import { useSession } from "sst/node/auth";
import { Logger } from "../../core/logging";
import { HttpError } from "../../core/utils/errors/Errors";
import JsonResponse, {
  CustomAPIGatewayProxyHandler,
  CustomAPIGatewayProxyResult,
  CustomContext,
  LambdaEvent,
} from "../../core/utils/lambda/types";

const LOGGER = new Logger("middleware");

/**
 * Middleware for API Gateway handlers
 */
type ApiGatewayMiddleware = MiddlewareObj<
  APIGatewayEvent,
  APIGatewayProxyStructuredResultV2,
  Error,
  CustomContext
>;
/**
 * Special API Gateway middleware that serializes JsonResponse objects
 */
type ApiGatewayPreSerializationMiddleware = MiddlewareObj<
  LambdaEvent,
  CustomAPIGatewayProxyResult,
  Error,
  CustomContext
>;

/**
 * Authenticate the user based on the JWT claims in the request from Cognito
 */
const AUTH_MIDDLEWARE: ApiGatewayMiddleware = {
  before: async (request) => {
    console.log({ headers: request.event.headers, context: request.context });
    const session = useSession();

    if (session.type !== "user") {
      LOGGER.warn("No user session found");
      throw new Error("User not set in session");
    }

    LOGGER.debug("Authenticated user: ", { userId: session.properties.id });

    Object.assign(request.context, { userId: session.properties.id });
  },
  onError: async (request) => {
    request.response = new JsonResponse({
      statusCode: 401,
      data: { message: "Unauthorized" },
    }).toApiGatewayResult();
  },
};

/**
 * Handles serializing a JsonResponse object to an API Gateway result
 *
 * It's important that this middleware comes before all other middlewares with `after`
 * functions, as it ensures that the response is type APIGatewayProxyStructuredResultV2.
 */
const JSON_RESPONSE_MIDDLEWARE: ApiGatewayPreSerializationMiddleware = {
  after: async (request) => {
    if (request.response instanceof JsonResponse)
      request.response = request.response.toApiGatewayResult();
  },
};

/**
 * To expose an error to the user, set the `expose` property on the error
 */
const JSON_ERROR_MIDDLEWARE: ApiGatewayMiddleware = {
  onError: async (request) => {
    if (request.response !== undefined || !request.error) return;

    const statusCode = (request.error as HttpError).statusCode || 500;
    const loggerMethod = statusCode >= 500 ? "error" : "info";
    LOGGER[loggerMethod]("Unhandled error in HTTP Lambda", request.error);

    const message = (request.error as HttpError).expose
      ? request.error.message
      : "Internal Server Error";

    request.response = new JsonResponse({
      statusCode,
      data: { message },
    }).toApiGatewayResult();
  },
};

/**
 * Wrap a handler with middleware for HTTP (API Gateway) handlers
 *
 * Middlewares after AUTH_MIDDLEWARE will have access to the user in the request
 * context, so they can use the CustomContext type. If a middleware does not come after
 * AUTH_MIDDLEWARE (e.g. all middlewares used by middifyForFunction) then we should use
 * a plain Context type.
 */
export const middyfyForHTTP = (handler: CustomAPIGatewayProxyHandler) =>
  middy(handler)
    // First to ensure responses created by middleware are modified too (middleware
    // are executed in reverse order when handling the response)
    .use(AUTH_MIDDLEWARE)
    .use(jsonBodyParser())
    .use(JSON_RESPONSE_MIDDLEWARE)
    .use(JSON_ERROR_MIDDLEWARE);

/**
 * Wrap a handler with middleware for non-HTTP handler (e.g. SQS or S3)
 * Should be wrapped with analytics (etc.) middlewares later when we have them
 */
export const middyfyForFunction = <T extends Handler>(handler: T) =>
  middy(handler);
