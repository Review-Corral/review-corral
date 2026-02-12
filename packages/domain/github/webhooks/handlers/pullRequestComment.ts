import { COLOURS } from "@core/slack/const";
import { fetchPrItem } from "@domain/postgres/fetchers/pull-requests";
import {
  addReviewThreadParticipant,
  getReviewThreadParticipants,
} from "@domain/postgres/fetchers/review-thread-participants";
import { PullRequestReviewCommentCreatedEvent } from "@octokit/webhooks-types";
import { Logger } from "../../../logging";
import { SlackClient } from "../../../slack/SlackClient";
import { BaseGithubWebhookEventHanderArgs } from "../types";
import { GithubWebhookEventHander } from "../types";
import {
  extractMentions,
  getDmAttachment,
  getSlackUserId,
  getSlackUserName,
} from "./shared";

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

    const replyThreadId = event.comment.in_reply_to_id;
    const isReply = replyThreadId != null;
    const threadParticipants = isReply
      ? await getReviewThreadParticipants({ threadId: replyThreadId })
      : [];

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

    // DM the PR author (if they weren't the commenter and weren't already mentioned)
    // For replies, avoid duplicating the thread reply notification if the author
    // is already a thread participant.
    if (
      event.pull_request.user.login !== event.sender.login &&
      !mentions.includes(event.pull_request.user.login) &&
      (!isReply || !threadParticipants.includes(event.pull_request.user.login))
    ) {
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

    // Notify other thread participants if this is a reply
    if (isReply) {
      dmPromises.push(
        notifyThreadParticipants({
          participants: threadParticipants,
          senderLogin: event.sender.login,
          pullRequest: event.pull_request,
          comment: event.comment,
          slackClient,
          args,
        }),
      );
    }

    await Promise.all(dmPromises);

    // Record this commenter as a thread participant
    // Use in_reply_to_id as thread ID if it's a reply, otherwise use the comment's own ID
    const threadId = event.comment.in_reply_to_id ?? event.comment.id;
    await addReviewThreadParticipant({
      threadId,
      githubUsername: event.sender.login,
    });

    return;
  }
};

/**
 * Notifies all previous participants in a review comment thread (except the sender).
 */
async function notifyThreadParticipants({
  participants,
  senderLogin,
  pullRequest,
  comment,
  slackClient,
  args,
}: {
  participants: string[];
  senderLogin: string;
  pullRequest: { title: string; number: number };
  comment: { html_url: string; body: string };
  slackClient: SlackClient;
  args: Pick<BaseGithubWebhookEventHanderArgs, "organizationId">;
}): Promise<void> {
  const notifyPromises = participants
    .filter((username) => username !== senderLogin)
    .map(async (username) => {
      const slackId = await getSlackUserId(username, args);
      if (slackId) {
        await slackClient.postDirectMessage({
          slackUserId: slackId,
          message: {
            text: `↩️ ${await getSlackUserName(senderLogin, args)} replied to a thread you're in`,
            attachments: [
              getDmAttachment(
                {
                  title: pullRequest.title,
                  number: pullRequest.number,
                  html_url: comment.html_url,
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
    });

  await Promise.all(notifyPromises);
}
