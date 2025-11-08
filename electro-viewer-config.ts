export const config = {
  profile: "rc",
  region: "us-east-1",
  entityConfigPaths: ["./packages/core/dynamodb/entities/*.ts"],
  env: {},
} as const;

export type ElectroViewerConfig = typeof config;
