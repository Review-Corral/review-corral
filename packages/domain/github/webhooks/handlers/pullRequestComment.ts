import { fetchPrItem } from "@domain/postgres/fetchers/pull-requests";
import { PullRequestReviewCommentCreatedEvent } from "@octokit/webhooks-types";
import { Logger } from "../../../logging";
import { GithubWebhookEventHander } from "../types";
import { getSlackUserId, getSlackUserName } from "./shared";

const LOGGER = new Logger("core.github.webhooks.handlers.pullRequest");

/**
 * Extracts GitHub username mentions (@username) from a comment body
 */
function extractMentions(commentBody: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(commentBody)) !== null) {
    mentions.push(match[1]);
  }

  return mentions;
}

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
      // write error log
      LOGGER.warn("Got a comment event but couldn't find the thread", {
        action: event.action,
        prId: event.pull_request.id,
      });

      return;
    }

    await slackClient.postComment({
      prId: event.pull_request.id,
      commentBody: event.comment.body,
      commentUrl: event.comment.html_url,
      threadTs: pullRequestItem.threadTs,
      slackUsername: await getSlackUserName(event.sender.login, args),
    });

    // Send DMs to mentioned users
    const mentions = extractMentions(event.comment.body);
    for (const githubUsername of mentions) {
      // Skip if the commenter mentioned themselves
      if (githubUsername === event.sender.login) {
        continue;
      }

      const mentionedUserSlackId = await getSlackUserId(githubUsername, args);
      if (mentionedUserSlackId) {
        await slackClient.postDirectMessage({
          slackUserId: mentionedUserSlackId,
          message: {
            text: `💬 ${await getSlackUserName(event.sender.login, args)} mentioned you in a comment on <${event.pull_request.html_url}|${event.pull_request.base.repo.full_name}#${event.pull_request.number}: ${event.pull_request.title}>`,
            attachments: [
              {
                text: event.comment.body,
              },
            ],
          },
        });
      }
    }

    return;
  }
};
