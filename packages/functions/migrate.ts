import { migrateToLatest } from "@core/db/db.js";
import { Logger } from "../core/logging/index.js";

process.env.MIGRATIONS_PATH = "services/core/db/migrations";

const LOGGER = new Logger("migrate");

export const migrate = async () => {
  LOGGER.info("About to run migrations...");
  await migrateToLatest();
  LOGGER.info("Migrate to latest done");
};

await migrate();
