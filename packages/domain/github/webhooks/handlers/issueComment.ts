import {
  getInstallationAccessToken,
  getPullRequestInfo,
} from "@domain/github/fetchers";
import { fetchPrItem } from "@domain/postgres/fetchers/pull-requests";
import { IssueCommentEvent } from "@octokit/webhooks-types";
import { Logger } from "../../../logging";
import { GithubWebhookEventHander } from "../types";
import { getSlackUserId, getSlackUserName } from "./shared";

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

const LOGGER = new Logger("core.github.webhooks.handlers.pullRequest");

export const handleIssueCommentEvent: GithubWebhookEventHander<
  IssueCommentEvent
> = async ({ event, slackClient, ...props }) => {
  LOGGER.debug("Hanlding Issue comment event with action: ", event.action);

  if (event.comment.user.type === "Bot") {
    LOGGER.debug("Issue comment is from a bot--skipping");
    return;
  }

  if (!event.issue.pull_request?.url) {
    LOGGER.debug("Issue comment is NOT on a pull request");
    return;
  }

  if (event.action === "created") {
    LOGGER.debug("Issue comment created", { issue: event.issue });

    LOGGER.debug("Issue comment is on a pull request", {
      issue: event.issue,
    });

    const accessToken = await getInstallationAccessToken(props.installationId);

    const { id: prId } = await getPullRequestInfo({
      url: event.issue.pull_request.url,
      accessToken: accessToken.token,
    });

    const pullRequestItem = await fetchPrItem({
      pullRequestId: prId,
      repoId: event.repository.id,
    });

    if (!pullRequestItem?.threadTs) {
      // write error log
      LOGGER.warn("Got a comment event but couldn't find the thread", {
        action: event.action,
        prId,
      });

      return;
    }

    await slackClient.postComment({
      prId,
      commentBody: event.comment.body,
      commentUrl: undefined,
      threadTs: pullRequestItem.threadTs,
      slackUsername: await getSlackUserName(event.sender.login, props),
    });

    // Send DMs to mentioned users
    const mentions = extractMentions(event.comment.body);
    for (const githubUsername of mentions) {
      // Skip if the commenter mentioned themselves
      if (githubUsername === event.sender.login) {
        continue;
      }

      const mentionedUserSlackId = await getSlackUserId(githubUsername, props);
      if (mentionedUserSlackId) {
        // Fetch PR info to get title and URL
        const prInfo = await getPullRequestInfo({
          url: event.issue.pull_request.url,
          accessToken: accessToken.token,
        });

        await slackClient.postDirectMessage({
          slackUserId: mentionedUserSlackId,
          message: {
            text: `💬 ${await getSlackUserName(event.sender.login, props)} mentioned you in a comment on <${prInfo.html_url}|${event.repository.full_name}#${event.issue.number}: ${event.issue.title}>`,
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
  } else {
    LOGGER.debug("Issue comment action not handled", { action: event.action });
  }
};
