import middy from "@middy/core";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
  SQSEvent,
} from "aws-lambda";
import { gzipSync } from "zlib";
import { User } from "../../dynamodb/entities/types";
import {
  MessageData,
  StatusCode2XX,
  StatusCode4XX,
  StatusCode5XX,
} from "./responses";

export interface CustomContext extends Context {
  userId?: User["userId"];
}

// The JSON_RESPONSE_MIDDLEWARE middleware will serialize the body if it's JsonResponse
export type CustomAPIGatewayProxyResult =
  | APIGatewayProxyStructuredResultV2
  | JsonResponse<any>;

export type CustomAPIGatewayProxyHandler = (
  event: APIGatewayProxyEventV2,
  context: CustomContext
) => Promise<CustomAPIGatewayProxyResult>;

export type LambdaEvent = APIGatewayProxyEvent | SQSEvent;

export const isApiGatewayProxyEvent = (
  event: LambdaEvent
): event is APIGatewayProxyEvent => {
  return (event as APIGatewayProxyEvent)?.requestContext !== undefined;
};

export const isCustomApiGatewayEvent = (
  event: middy.Request<any, any, any, any>
): event is middy.Request<
  APIGatewayProxyEvent,
  APIGatewayProxyStructuredResultV2,
  Error,
  CustomContext
> => {
  // Should pass even if user exists but is undefined
  return "user" in event.context;
};

type ApiGatewayResultProps = Omit<
  APIGatewayProxyStructuredResultV2,
  "statusCode" | "body"
>;

type GzipValue = boolean | "auto";

type ResponseOptions<Json extends Record<string, any>> = (
  | { statusCode: StatusCode2XX; data: Json }
  | { statusCode: StatusCode4XX | StatusCode5XX; data: Json & MessageData }
) & {
  gzip?: GzipValue;
  serializer?: (data: Json) => string;
} & ApiGatewayResultProps;

/**
 * Custom response class that enforces certain JSON properties for non-2XX status codes
 *
 * Also automatically serializes the JSON data and adds the Content-Type header.
 */
export default class JsonResponse<Json extends Record<string, any>> {
  /**
   * If the response body is larger than this threshold, it will be gzipped
   * automatically. Can be overridden by setting the `gzip` option to a boolean.
   */
  private static autoGzipByteThreshold = 1024;

  public readonly statusCode: number;
  public readonly data: Json;
  public readonly apiGatewayResultProps: ApiGatewayResultProps;
  public readonly gzip: GzipValue;
  public readonly serializer: (data: Json) => string;

  constructor({
    statusCode,
    data,
    gzip,
    serializer,
    ...rest
  }: ResponseOptions<Json>) {
    this.statusCode = statusCode;
    this.data = data;
    this.apiGatewayResultProps = rest;
    this.gzip = gzip ?? "auto";
    this.serializer = serializer ?? JSON.stringify;
  }

  public toApiGatewayResult(): APIGatewayProxyStructuredResultV2 {
    const { headers, ...rest } = this.apiGatewayResultProps;
    const headersFinal: typeof headers = {
      "Content-Type": "application/json",
      ...headers,
    };
    const bodyObject = this.getBodyObject();
    if (bodyObject.isBase64Encoded) headersFinal["Content-Encoding"] = "gzip";

    return {
      statusCode: this.statusCode,
      headers: headersFinal,
      ...bodyObject,
      ...rest,
    };
  }

  private getBodyObject(): { body: string; isBase64Encoded: boolean } {
    const dataAsString = this.serializer(this.data);
    const shouldGzip =
      this.gzip === true ||
      (this.gzip === "auto" &&
        Buffer.byteLength(dataAsString) > JsonResponse.autoGzipByteThreshold);
    if (!shouldGzip) return { body: dataAsString, isBase64Encoded: false };

    // Since AWS HTTP APIs don't support automatic gzip compression, we have to do it
    // ourselves. And the API Gateway expects the binary data to be base64 encoded.
    return {
      body: gzipSync(dataAsString).toString("base64"),
      isBase64Encoded: true,
    };
  }
}
