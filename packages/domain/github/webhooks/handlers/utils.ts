import { PullRequestInfoResponse } from "@domain/github/endpointTypes";
import { BasePullRequestProperties } from "@domain/slack/SlackClient";
import { PullRequestEvent, Team, User } from "@octokit/webhooks-types";

export const convertPullRequestInfoToBaseProps = (
  response: PullRequestInfoResponse,
): BasePullRequestProperties => {
  return {
    pull_request: {
      title: response.title,
      number: response.number,
      html_url: response.html_url,
      body: response.body,
      user: {
        avatar_url: response.user.avatar_url,
        login: response.user.login,
      },
      additions: response.additions,
      deletions: response.deletions,
      base: {
        ref: response.base.ref,
      },
      merged: response.merged,
      draft: response.draft ?? false,
      closed_at: response.closed_at,
    },
    repository: {
      full_name: response.base.repo.full_name,
      owner: {
        avatar_url: response.base.repo.owner.avatar_url,
      },
    },
  };
};

export const convertPrEventToBaseProps = (
  event: PullRequestEvent,
): BasePullRequestProperties => {
  return {
    ...event,
    pull_request: {
      ...event.pull_request,
      merged: event.pull_request.merged ?? false,
      draft: event.pull_request.draft ?? false,
      closed_at: event.pull_request.closed_at,
    },
  };
};

/**
 * Extracts user reviewer logins from requested_reviewers array.
 * Filters out teams (which don't have a login field).
 */
export function extractReviewerLogins(
  requestedReviewers: (User | Team)[] | undefined,
): string[] {
  if (!requestedReviewers) return [];

  return requestedReviewers
    .filter((reviewer): reviewer is User => "login" in reviewer)
    .map((reviewer) => reviewer.login);
}
