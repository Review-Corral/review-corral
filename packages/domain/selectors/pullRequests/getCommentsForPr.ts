import { PullRequestReviewCommentsResponse } from "@domain/github/endpointTypes";
import { getInstallationAccessToken } from "@domain/github/fetchers";
import { LOGGER } from "@domain/github/webhooks/handlers/pullRequest";
import { getSlackUserName } from "@domain/github/webhooks/handlers/shared";
import { BaseGithubWebhookEventHanderArgs } from "@domain/github/webhooks/types";
import { PullRequestEventOpenedOrReadyForReview } from "@domain/slack/SlackClient";
import ky from "ky";

// TODO: this shouldn't be in selectors...
export async function postCommentsForNewPR(
  body: PullRequestEventOpenedOrReadyForReview,
  accessToken: Awaited<ReturnType<typeof getInstallationAccessToken>>,
  threadTs: string,
  baseProps: BaseGithubWebhookEventHanderArgs,
) {
  try {
    const response = await ky
      .get(body.pull_request.comments_url, {
        headers: {
          Authorization: `bearer ${accessToken.token}`,
        },
      })
      .json<PullRequestReviewCommentsResponse>();

    for (const comment of response) {
      if (comment.user.type === "User") {
        await baseProps.slackClient.postComment({
          prId: body.pull_request.id,
          commentBody: comment.body,
          commentUrl: comment.url,
          threadTs: threadTs,
          slackUsername: await getSlackUserName(comment.user.login, baseProps),
        });
      }
    }
  } catch (error) {
    LOGGER.error("Error getting comments", {
      error,
      prId: body.pull_request.id,
      installationId: baseProps.installationId,
      organizationId: baseProps.organizationId,
    });
  }
}
