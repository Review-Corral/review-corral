import { Resource } from "sst";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(Resource.NeonDatabaseUrl.value);

export const db = drizzle(sql, { schema });
