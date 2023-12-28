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
  if (process.env.DB_PASSWORD) {
    const creds = {
      host: process.env.DB_HOST!!,
      port: parseInt(process.env.DB_PORT!!),
      database: process.env.DB_NAME!!,
      user: process.env.DB_USER!!,
      password: process.env.DB_PASSWORD!!,
    };
    console.log("Going to be using these local credentials: ", { creds });
    return creds;
  } else {
    console.log("Going to be fetching remote credentials...");
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

  return {
    host: dbSecret.host as string,
    port: dbSecret.port as number,
    database: dbSecret.dbname as string,
    user: dbSecret.username as string,
    password: dbSecret.password as string,
  };
}
