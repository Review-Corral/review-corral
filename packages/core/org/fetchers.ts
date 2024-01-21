import { eq } from "drizzle-orm";
import { DB } from "../db/db";
import { usernameMappings } from "../db/schema";

export const fetchUsernameMappings = async (orgId: number) =>
  await DB.select()
    .from(usernameMappings)
    .where(eq(usernameMappings.organizationId, orgId));
