import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import type { Config } from "drizzle-kit";
import { Logger } from "../logging";
import { assertVarExists } from "../utils/assert";

const LOGGER = new Logger("drizzle.config.ts");

export default {
  schema: "./schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: await getDbCredentials(),
} satisfies Config;

async function getDbCredentials() {
  if (assertVarExists("IS_LOCAL") === "true") {
    const creds = {
      host: process.env.DB_HOST!!,
      port: parseInt(process.env.DB_PORT!!),
      database: process.env.DB_NAME!!,
      user: process.env.DB_USER!!,
      password: process.env.DB_PASSWORD!!,
    };
    LOGGER.debug("Going to be using these local credentials: ", { creds });
    return creds;
  } else {
    LOGGER.debug("Going to be fetching remote credentials...");
    return fetchSecretDbCredentials();
  }
}

async function fetchSecretDbCredentials() {
  const dbSecretArn = assertVarExists("DB_CREDENTIALS_SECRET_ARN");

  const secretsManagerClient = new SecretsManagerClient({});
  const dbSecretResponse = await secretsManagerClient.send(
    new GetSecretValueCommand({ SecretId: dbSecretArn })
  );

  const dbSecret = dbSecretResponse.SecretString
    ? JSON.parse(dbSecretResponse.SecretString)
    : JSON.parse(Buffer.from(dbSecretResponse.SecretBinary!).toString("utf8"));

  LOGGER.debug("Finshed fetching remote credentials", { dbSecretArn });

  return {
    host: dbSecret.host as string,
    port: dbSecret.port as number,
    database: dbSecret.dbname as string,
    user: dbSecret.username as string,
    password: dbSecret.password as string,
  };
}
