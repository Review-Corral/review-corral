import { PullRequestInfoResponse } from "@domain/github/endpointTypes";
import { BasePullRequestProperties } from "@domain/slack/SlackClient";

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
    },
    repository: {
      full_name: response.base.repo.full_name,
      owner: {
        avatar_url: response.user.avatar_url,
      },
    },
  };
};
