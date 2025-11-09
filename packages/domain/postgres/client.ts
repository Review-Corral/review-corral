import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { Resource } from "sst";
import * as schema from "./schema";

const sql = neon(Resource.NEON_DATABASE_URL.value);

export const db = drizzle(sql, { schema });
