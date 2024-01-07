import { and, eq } from "drizzle-orm";
import { DB } from "../db";
import { usernameMappings } from "../schema";
import { takeFirst } from "./utils";

export const getSlackUseridFromGithubLogin = async ({
  githubLogin,
  organizationId,
}: {
  githubLogin: string;
  organizationId: number;
}) => {
  return DB.select()
    .from(usernameMappings)
    .where(
      and(
        eq(usernameMappings.organizationId, organizationId),
        eq(usernameMappings.githubUsername, githubLogin)
      )
    )
    .limit(1)
    .then(takeFirst);
};
