import { StackProps } from "aws-cdk-lib";
import { App, Function, FunctionProps, Stack } from "sst/constructs";
import Database, { getDbConnectionInfo } from "./Database";

interface MigrationFunctionProps extends StackProps {
  app: App;
  database?: Database;
  functionDefaults: FunctionProps;
}

const MIGRATIONS_PATH_LOCAL = "packages/core/db/migrations";
const MIGRATIONS_PATH_CONTAINER = "migrations";

export default class MigrationFunction extends Function {
  constructor(stack: Stack, id: string, props: MigrationFunctionProps) {
    const { app, database, functionDefaults } = props;

    super(stack, id, {
      ...functionDefaults,
      handler: "packages/functions/src/migrateToLatest.handler",
      // Same timeout as in seed.yml after_deploy stage
      timeout: "10 minutes",
      copyFiles: [
        {
          from: MIGRATIONS_PATH_LOCAL,
          to: MIGRATIONS_PATH_CONTAINER,
        },
      ],
      environment: {
        ...getDbConnectionInfo(app, database),
        MIGRATIONS_PATH: app.local
          ? MIGRATIONS_PATH_LOCAL
          : MIGRATIONS_PATH_CONTAINER,
      },
    });
  }
}
