export const config = {
  profile: "rc",
  region: "us-east-1",
  entityConfigPaths: ["packages/core/dynamodb/entities/*.ts"],
  tsconfigPath: "./tsconfig.json",
  env: {
    IS_PERMISSIONED_ENV: "false",
    NODE_ENV: "development",
  },
} as const;

export type ElectroViewerConfig = typeof config;
