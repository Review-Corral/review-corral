import { migrateToLatest } from "../core/db/db";
import { Logger } from "../core/logging";

const LOGGER = new Logger("migrate");

export const migrate = async () => {
  LOGGER.info("About to run migrations...");
  await migrateToLatest();
  LOGGER.info("Migrate to latest done");
};

await migrate();
