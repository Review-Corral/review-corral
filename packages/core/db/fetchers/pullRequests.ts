import { eq } from "drizzle-orm";
import { Db } from "../../dynamodb";
import { PullRequest } from "../../dynamodb/entities/types";
import { DB } from "../db";
import { pullRequests } from "../schema";
import { PullRequestInsertionArgs } from "../types";
import { takeFirstOrThrow } from "./utils";

export const fetchPullRequestById = async ({
  pullRequestId,
  repoId,
}: {
  pullRequestId: number;
  repoId: number;
}): Promise<PullRequest> => {
  return await Db.entities.pullRequest
    .get({ prId: pullRequestId, repoId })
    .go()
    .then(({ data }) => {
      if (!data) {
        throw new Error(
          `Could not find pull request with id: ${pullRequestId} in repoId: ${repoId}`
        );
      }
      return data;
    });
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
