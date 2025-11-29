import {
  getInstallationAccessToken,
  getPullRequestInfo,
} from "@domain/github/fetchers";
import { trackDmForReactions } from "@domain/slack/dmTracking";
import { IssueCommentEvent } from "@octokit/webhooks-types";
import { Logger } from "../../../logging";
import { GithubWebhookEventHander } from "../types";
import {
  extractMentions,
  getDmAttachment,
  getSlackUserId,
  getSlackUserName,
} from "./shared";

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

    // Fetch PR info once for all DMs
    const prInfo = await getPullRequestInfo({
      url: event.issue.pull_request.url,
      accessToken: accessToken.token,
    });

    // Send DMs to mentioned users and PR author
    const mentions = extractMentions(event.comment.body);
    const dmPromises: Promise<void>[] = [];

    // Context for tracking DMs for reaction sync
    const trackingContext = {
      githubCommentId: event.comment.id,
      commentType: "issue_comment" as const,
      repoOwner: event.repository.owner.login,
      repoName: event.repository.name,
      orgId: props.organizationId,
    };

    for (const githubUsername of mentions) {
      // Skip if the commenter mentioned themselves
      if (githubUsername === event.sender.login) {
        continue;
      }

      dmPromises.push(
        (async () => {
          const mentionedUserSlackId = await getSlackUserId(githubUsername, props);
          if (mentionedUserSlackId) {
            const dmResponse = await slackClient.postDirectMessage({
              slackUserId: mentionedUserSlackId,
              message: {
                text: `💬 ${await getSlackUserName(event.sender.login, props)} mentioned you in a comment`,
                attachments: [
                  getDmAttachment(
                    {
                      title: event.issue.title,
                      number: event.issue.number,
                      html_url: prInfo.html_url,
                    },
                    "gray",
                  ),
                  {
                    text: event.comment.body,
                  },
                ],
              },
            });
            if (dmResponse) {
              await trackDmForReactions(dmResponse, trackingContext);
            }
          }
        })(),
      );
    }

    // TODO: and they weren't messaged about this already
    // DM the PR author (if they weren't the commenter)
    if (prInfo.user.login !== event.sender.login) {
      dmPromises.push(
        (async () => {
          const authorSlackId = await getSlackUserId(prInfo.user.login, props);
          if (authorSlackId) {
            const dmResponse = await slackClient.postDirectMessage({
              slackUserId: authorSlackId,
              message: {
                text: `💬 ${await getSlackUserName(event.sender.login, props)} commented on your PR`,
                attachments: [
                  getDmAttachment(
                    {
                      title: event.issue.title,
                      number: event.issue.number,
                      html_url: prInfo.html_url,
                    },
                    "gray",
                  ),
                  ...(event.comment.body
                    ? [
                        {
                          text: event.comment.body,
                        },
                      ]
                    : []),
                ],
              },
            });
            if (dmResponse) {
              await trackDmForReactions(dmResponse, trackingContext);
            }
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
