import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import type { Config } from "drizzle-kit";
import { assertVarExists } from "../utils/assert";

export default {
  schema: "./schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: await getDbCredentials(),
} satisfies Config;

async function getDbCredentials() {
  return process.env.DB_PASSWORD
    ? {
        host: assertVarExists("DB_HOST"),
        port: process.env.DB_PORT ? parseInt("DB_PORT") : undefined,
        database: assertVarExists("DB_NAME"),
        user: assertVarExists("DB_USER"),
        password: assertVarExists("DB_PASSWORD"),
      }
    : fetchSecretDbCredentials();
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

  return {
    host: dbSecret.host as string,
    port: dbSecret.port as number,
    database: dbSecret.dbname as string,
    user: dbSecret.username as string,
    password: dbSecret.password as string,
  };
}
