import { defineConfig } from "drizzle-kit";
import { Resource } from "sst";

export default defineConfig({
  dialect: "postgresql",
  schema: "./packages/domain/postgres/schema/*.ts",
  out: "./packages/domain/postgres/migrations",
  dbCredentials: {
    url: Resource.NEON_DATABASE_URL.value,
  },
});
