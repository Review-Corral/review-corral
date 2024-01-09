const TEST_ENV: Record<string, string> = {
  LOG_LEVEL: "debug",
  AWS_LAMBDA_FUNCTION_NAME: "vitest-a-b-c-testRunner-d",
  BASE_FE_URL: "https://example.com",
  TZ: "UTC",
  DB_HOST: "foobar",
  DB_NAME: "foobar",
  DB_USER: "foobar",
  DB_PASSWORD: "foobar",
  GH_WEBHOOK_SECRET: "secret",
};

export default async function (): Promise<void> {
  Object.assign(process.env, TEST_ENV);
}
