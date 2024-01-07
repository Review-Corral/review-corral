import { eq } from "drizzle-orm";
import { DB } from "../db";
import { pullRequests } from "../schema";
import { PullRequest, PullRequestInsertionArgs } from "../types";
import { takeFirst, takeFirstOrThrow } from "./utils";

export const fetchPullRequestById = async (pullRequestId: number) => {
  return await DB.select()
    .from(pullRequests)
    .where(eq(pullRequests.id, pullRequestId))
    .limit(1)
    .then(takeFirst);
};

export const insertPullRequest = async (
  args: PullRequestInsertionArgs
): Promise<PullRequest> =>
  await DB.insert(pullRequests).values(args).returning().then(takeFirstOrThrow);

export const updatePullRequest = async (
  args: PullRequestInsertionArgs
): Promise<PullRequest> =>
  await DB.update(pullRequests)
    .set(args)
    .where(eq(pullRequests.id, args.id))
    .returning()
    .then(takeFirstOrThrow);
