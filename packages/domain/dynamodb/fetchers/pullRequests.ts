import {
  PullRequestInsertArgs,
  PullRequestItem,
  PullRequestUpdateArgs,
} from "@core/dynamodb/entities/types";
import { Db } from "../client";

export const fetchPrItem = async ({
  pullRequestId,
  repoId,
}: {
  pullRequestId: number;
  repoId: number;
}): Promise<PullRequestItem | null> => {
  return await Db.entities.pullRequest
    .get({ prId: pullRequestId, repoId })
    .go()
    .then(({ data }) => {
      if (!data) {
        return null;
      }
      return data;
    });
};

export const forceFetchPrItem = async ({
  pullRequestId,
  repoId,
}: {
  pullRequestId: number;
  repoId: number;
}): Promise<PullRequestItem> => {
  return await Db.entities.pullRequest
    .get({ prId: pullRequestId, repoId })
    .go()
    .then(({ data }) => {
      if (!data) {
        throw new Error(
          `Could not find pull request with id: ${pullRequestId} in repoId: ${repoId}`,
        );
      }
      return data;
    });
};

export const insertPullRequest = async (
  args: PullRequestInsertArgs,
): Promise<PullRequestItem> =>
  await Db.entities.pullRequest
    .create(args)
    .go()
    .then(({ data }) => data);

export const updatePullRequest = async ({
  pullRequestId,
  repoId,
  ...args
}: PullRequestUpdateArgs & {
  pullRequestId: number;
  repoId: number;
}) =>
  await Db.entities.pullRequest.patch({ prId: pullRequestId, repoId }).set(args).go();
