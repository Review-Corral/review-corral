import { fetchPrItem } from "@domain/postgres/fetchers/pull-requests";
import { PullRequestReviewCommentCreatedEvent } from "@octokit/webhooks-types";
import { Logger } from "../../../logging";
import { GithubWebhookEventHander } from "../types";
import {
  extractMentions,
  getDmAttachment,
  getSlackUserId,
  getSlackUserName,
} from "./shared";
import { COLOURS } from "@core/slack/const";

const LOGGER = new Logger("core.github.webhooks.handlers.pullRequest");

export const handlePullRequestCommentEvent: GithubWebhookEventHander<
  PullRequestReviewCommentCreatedEvent
> = async ({ event, slackClient, ...args }) => {
  if (event.comment.user.type === "Bot") {
    LOGGER.debug("Pull request comment is from a bot--skipping");
    return;
  }

  if (event.action === "created") {
    const pullRequestItem = await fetchPrItem({
      pullRequestId: event.pull_request.id,
      repoId: event.repository.id,
    });

    if (!pullRequestItem?.threadTs) {
      LOGGER.warn("Got a comment event but couldn't find the PR", {
        action: event.action,
        prId: event.pull_request.id,
      });
      return;
    }

    // Send DMs to mentioned users and PR author
    const mentions = extractMentions(event.comment.body);
    const dmPromises: Promise<void>[] = [];

    for (const githubUsername of mentions) {
      // Skip if the commenter mentioned themselves
      if (githubUsername === event.sender.login) {
        continue;
      }

      dmPromises.push(
        (async () => {
          const mentionedUserSlackId = await getSlackUserId(githubUsername, args);
          if (mentionedUserSlackId) {
            await slackClient.postDirectMessage({
              slackUserId: mentionedUserSlackId,
              message: {
                text: `💬 ${await getSlackUserName(event.sender.login, args)} mentioned you in a comment`,
                attachments: [
                  getDmAttachment(
                    {
                      title: event.pull_request.title,
                      number: event.pull_request.number,
                      html_url: event.pull_request.html_url,
                    },
                    "gray",
                  ),
                  {
                    text: event.comment.body,
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
    if (event.pull_request.user.login !== event.sender.login) {
      dmPromises.push(
        (async () => {
          const authorSlackId = await getSlackUserId(
            event.pull_request.user.login,
            args,
          );
          if (authorSlackId) {
            await slackClient.postDirectMessage({
              slackUserId: authorSlackId,
              message: {
                text: `💬 ${await getSlackUserName(event.sender.login, args)} commented on your PR`,
                attachments: [
                  getDmAttachment(
                    {
                      title: event.pull_request.title,
                      number: event.pull_request.number,
                      html_url: event.pull_request.html_url,
                    },
                    "gray",
                  ),
                  {
                    text: event.comment.body,
                    color: COLOURS.gray,
                  },
                ],
              },
            });
          }
        })(),
      );
    }

    await Promise.all(dmPromises);

    return;
  }
};
