import { Db } from "../../dynamodb";
import {
  PullRequest,
  PullRequestInsertArgs,
  PullRequestUpdateArgs,
} from "../../dynamodb/entities/types";

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
  args: PullRequestInsertArgs
): Promise<PullRequest> =>
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
  await Db.entities.pullRequest
    .patch({ prId: pullRequestId, repoId })
    .set(args)
    .go();
