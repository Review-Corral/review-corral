import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { migrateToLatest } from "../../core/db/db";
import { Logger } from "../../core/logging";
import { stringifyError } from "../../core/utils/errors/strings";

const LOGGER = new Logger("migrateToLatest");

// We use an API Gateway handler type to ensure that the Lambda returns an HTTP
// response, which we rely on in CI to determine whether the migration was successful.
const lambda: APIGatewayProxyHandlerV2 = async () => {
  try {
    LOGGER.info("About to run migrations...");
    await migrateToLatest();
    LOGGER.info("Migrate to latest done");
    return { statusCode: 200, body: JSON.stringify({ message: "OK" }) };
  } catch (err) {
    LOGGER.error("Got error trying to migrate to latest", err);
    // Got to manually respond here because we're not using middyfyForHTTP
    return {
      statusCode: 500,
      body: JSON.stringify({ message: stringifyError(err) }),
    };
  }
};

export const handler = lambda;
