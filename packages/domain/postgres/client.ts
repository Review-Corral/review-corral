import { Resource } from "sst";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(Resource.NEON_DATABASE_URL.value);

export const db = drizzle(sql, { schema });
