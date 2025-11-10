import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./packages/domain/postgres/schema/*.ts",
  out: "./packages/domain/postgres/migrations",
  dbCredentials: {
    // Dummy URL for CI - generate command doesn't need actual DB connection
    url: "postgresql://user:pass@localhost:5432/db",
  },
});
