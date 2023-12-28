import { DefaultLogger, LogWriter } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { Logger } from "../logging";
import drizzleConfig from "./drizzle.config";

const poolConfig = new Pool({
  ...drizzleConfig.dbCredentials,
});

const LOGGER = new Logger("DB");

class CustomOrmLogger implements LogWriter {
  write(message: string): void {
    LOGGER.debug(message);
  }
}

const logger = new DefaultLogger({ writer: new CustomOrmLogger() });
export const DB = drizzle(poolConfig, { logger });

export const toTimestamp = (date: Date): string => {
  return date.toISOString();
};

export const migrateToLatest = async () => {
  const migrationsPath = process.env.MIGRATIONS_PATH;

  if (!migrationsPath) {
    throw new Error("MIGRATIONS_PATH is not defined");
  }

  await migrate(DB, { migrationsFolder: migrationsPath });
};
