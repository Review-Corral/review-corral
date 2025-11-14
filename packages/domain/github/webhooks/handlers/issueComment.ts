import {
  getInstallationAccessToken,
  getPullRequestInfo,
} from "@domain/github/fetchers";
import { fetchPrItem } from "@domain/postgres/fetchers/pull-requests";
import { IssueCommentEvent } from "@octokit/webhooks-types";
import { Logger } from "../../../logging";
import { GithubWebhookEventHander } from "../types";
import { extractMentions, getSlackUserId, getSlackUserName } from "./shared";

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
      LOGGER.warn("Got a comment event but couldn't find the PR", {
        action: event.action,
        prId,
      });
      return;
    }

    // Fetch PR info once for all DMs
    const prInfo = await getPullRequestInfo({
      url: event.issue.pull_request.url,
      accessToken: accessToken.token,
    });

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
          const mentionedUserSlackId = await getSlackUserId(githubUsername, props);
          if (mentionedUserSlackId) {
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
        })(),
      );
    }

    // DM the PR author (if they weren't the commenter)
    if (prInfo.user.login !== event.sender.login) {
      dmPromises.push(
        (async () => {
          const authorSlackId = await getSlackUserId(prInfo.user.login, props);
          if (authorSlackId) {
            await slackClient.postDirectMessage({
              slackUserId: authorSlackId,
              message: {
                text: `💬 ${await getSlackUserName(event.sender.login, props)} commented on your PR: <${prInfo.html_url}|${event.repository.full_name}#${event.issue.number}: ${event.issue.title}>`,
                attachments: [
                  {
                    text: event.comment.body,
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
  } else {
    LOGGER.debug("Issue comment action not handled", { action: event.action });
  }
};
