import { COLOURS } from "@core/slack/const";
import { PullRequestReviewCommentsResponse } from "@domain/github/endpointTypes";
import { getInstallationAccessToken } from "@domain/github/fetchers";
import { LOGGER } from "@domain/github/webhooks/handlers/pullRequest";
import {
  extractMentions,
  getDmAttachment,
  getSlackUserId,
  getSlackUserName,
} from "@domain/github/webhooks/handlers/shared";
import { BaseGithubWebhookEventHanderArgs } from "@domain/github/webhooks/types";
import { PullRequestEventOpenedOrReadyForReview } from "@domain/slack/SlackClient";
import ky from "ky";

// TODO: this shouldn't be in selectors...
export async function postCommentsForNewPR(
  body: PullRequestEventOpenedOrReadyForReview,
  accessToken: Awaited<ReturnType<typeof getInstallationAccessToken>>,
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

    // Send DMs for each comment
    const dmPromises: Promise<void>[] = [];

    for (const comment of response) {
      if (comment.user.type === "User") {
        // Extract mentions from comment
        const mentions = extractMentions(comment.body);

        // Send DM to each mentioned user
        for (const githubUsername of mentions) {
          // Skip if the commenter mentioned themselves
          if (githubUsername === comment.user.login) {
            continue;
          }

          dmPromises.push(
            (async () => {
              const mentionedUserSlackId = await getSlackUserId(
                githubUsername,
                baseProps,
              );
              if (mentionedUserSlackId) {
                await baseProps.slackClient.postDirectMessage({
                  slackUserId: mentionedUserSlackId,
                  message: {
                    text: `💬 ${await getSlackUserName(comment.user.login, baseProps)} mentioned you in a comment`,
                    attachments: [
                      getDmAttachment(
                        {
                          title: body.pull_request.title,
                          number: body.pull_request.number,
                          html_url: body.pull_request.html_url,
                        },
                        "gray",
                      ),
                      {
                        text: comment.body,
                        color: COLOURS.gray,
                      },
                    ],
                  },
                });
              }
            })(),
          );
        }

        // DM the PR author (if they weren't the commenter)
        // if (body.pull_request.user.login !== comment.user.login || true) {
        dmPromises.push(
          (async () => {
            const authorSlackId = await getSlackUserId(
              body.pull_request.user.login,
              baseProps,
            );
            if (authorSlackId) {
              await baseProps.slackClient.postDirectMessage({
                slackUserId: authorSlackId,
                message: {
                  text: `💬 ${await getSlackUserName(comment.user.login, baseProps)} commented on your PR`,
                  attachments: [
                    getDmAttachment(
                      {
                        title: body.pull_request.title,
                        number: body.pull_request.number,
                        html_url: body.pull_request.html_url,
                      },
                      "gray",
                    ),
                    {
                      text: comment.body,
                      color: COLOURS.gray,
                    },
                  ],
                },
              });
            } else {
              LOGGER.warn("No Slack ID found for PR author", {
                prId: body.pull_request.id,
                author: body.pull_request.user.login,
              });
            }
          })(),
        );
      }
      // }
    }

    await Promise.all(dmPromises);
  } catch (error) {
    LOGGER.error("Error getting comments", {
      error,
      prId: body.pull_request.id,
      installationId: baseProps.installationId,
      organizationId: baseProps.organizationId,
    });
  }
}
