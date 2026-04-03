import {
  getInstallationAccessToken,
  getPullRequestInfo,
} from "@domain/github/fetchers";
import {
  addPrCommentParticipant,
  getPrCommentParticipants,
} from "@domain/postgres/fetchers/pr-comment-participants";
import { slackCommentDmTargetType } from "@domain/postgres/schema/slack-comment-dm-mappings";
import { IssueCommentEvent } from "@octokit/webhooks-types";
import { Logger } from "../../../logging";
import { GithubWebhookEventHander } from "../types";
import {
  extractMentions,
  getDmAttachment,
  getSlackUserId,
  getSlackUserName,
  persistCommentDmMapping,
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

    // Get previous participants before adding the current commenter
    const previousParticipants = await getPrCommentParticipants({
      prId: prInfo.id,
    });

    // Record this commenter as a participant
    await addPrCommentParticipant({
      prId: prInfo.id,
      githubUsername: event.sender.login,
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
            const dmResult = await slackClient.postDirectMessage({
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

            await persistCommentDmMapping({
              dmResult,
              args: props,
              targetType: slackCommentDmTargetType.issueComment,
              repositoryFullName: event.repository.full_name,
              githubCommentId: event.comment.id,
              commentAuthorGithubUsername: event.comment.user.login,
              commentBody: event.comment.body,
              prTitle: event.issue.title,
              prNumber: event.issue.number,
              commentUrl: event.comment.html_url,
            });
          }
        })(),
      );
    }

    // DM the PR author (if they weren't the commenter and weren't already mentioned)
    if (
      prInfo.user.login !== event.sender.login &&
      !mentions.includes(prInfo.user.login)
    ) {
      dmPromises.push(
        (async () => {
          const authorSlackId = await getSlackUserId(prInfo.user.login, props);
          if (authorSlackId) {
            const dmResult = await slackClient.postDirectMessage({
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

            await persistCommentDmMapping({
              dmResult,
              args: props,
              targetType: slackCommentDmTargetType.issueComment,
              repositoryFullName: event.repository.full_name,
              githubCommentId: event.comment.id,
              commentAuthorGithubUsername: event.comment.user.login,
              commentBody: event.comment.body,
              prTitle: event.issue.title,
              prNumber: event.issue.number,
              commentUrl: event.comment.html_url,
            });
          }
        })(),
      );
    }

    // Notify all previous participants (except commenter, PR author, and @mentioned)
    for (const participantUsername of previousParticipants) {
      // Skip: self, PR author (already notified above), @mentioned (already notified above)
      if (
        participantUsername === event.sender.login ||
        participantUsername === prInfo.user.login ||
        mentions.includes(participantUsername)
      ) {
        continue;
      }

      dmPromises.push(
        (async () => {
          const participantSlackId = await getSlackUserId(participantUsername, props);
          if (participantSlackId) {
            const dmResult = await slackClient.postDirectMessage({
              slackUserId: participantSlackId,
              message: {
                text: `↩️ ${await getSlackUserName(event.sender.login, props)} replied in a thread you're in`,
                attachments: [
                  getDmAttachment(
                    {
                      title: event.issue.title,
                      number: event.issue.number,
                      html_url: event.comment.html_url,
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

            await persistCommentDmMapping({
              dmResult,
              args: props,
              targetType: slackCommentDmTargetType.issueComment,
              repositoryFullName: event.repository.full_name,
              githubCommentId: event.comment.id,
              commentAuthorGithubUsername: event.comment.user.login,
              commentBody: event.comment.body,
              prTitle: event.issue.title,
              prNumber: event.issue.number,
              commentUrl: event.comment.html_url,
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
