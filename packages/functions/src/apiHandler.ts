import { APIGatewayProxyEvent, Context } from "aws-lambda";

export function ApiHandler(
  lambda: (
    evt: APIGatewayProxyEvent,
    context: Context,
  ) => Promise<{
    body: object | string;
    statusCode: number;
    headers?: Record<string, string>;
  }>,
) {
  return async (event: APIGatewayProxyEvent, context: Context) => {
    let body: object | string;
    let statusCode: number;
    let headers: Record<string, string> | undefined;

    try {
      // Run the Lambda
      ({ body, statusCode, headers } = await lambda(event, context));
    } catch (error) {
      statusCode = 500;
      body = {
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // Return HTTP response
    return {
      body: typeof body === "string" ? body : JSON.stringify(body),
      statusCode,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        ...headers,
      },
    };
  };
}
