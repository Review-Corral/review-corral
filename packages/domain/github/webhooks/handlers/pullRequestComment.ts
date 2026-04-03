import { COLOURS } from "@core/slack/const";
import { fetchPrItem } from "@domain/postgres/fetchers/pull-requests";
import {
  addReviewThreadParticipant,
  getReviewThreadParticipants,
} from "@domain/postgres/fetchers/review-thread-participants";
import { slackCommentDmTargetType } from "@domain/postgres/schema/slack-comment-dm-mappings";
import { PullRequestReviewCommentCreatedEvent } from "@octokit/webhooks-types";
import { Logger } from "../../../logging";
import { SlackClient } from "../../../slack/SlackClient";
import { BaseGithubWebhookEventHanderArgs, GithubWebhookEventHander } from "../types";
import {
  extractMentions,
  getDmAttachment,
  getSlackUserId,
  getSlackUserName,
  persistCommentDmMapping,
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

    const mentions = extractMentions(event.comment.body);
    const dmPromises: Promise<void>[] = [];

    for (const githubUsername of mentions) {
      if (githubUsername === event.sender.login) {
        continue;
      }

      dmPromises.push(
        (async () => {
          const mentionedUserSlackId = await getSlackUserId(githubUsername, args);
          if (!mentionedUserSlackId) {
            return;
          }

          const dmResult = await slackClient.postDirectMessage({
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

          await persistCommentDmMapping({
            dmResult,
            args,
            targetType: slackCommentDmTargetType.pullRequestReviewComment,
            repositoryFullName: event.repository.full_name,
            githubCommentId: event.comment.id,
            commentAuthorGithubUsername: event.comment.user.login,
            commentBody: event.comment.body,
            prTitle: event.pull_request.title,
            prNumber: event.pull_request.number,
            commentUrl: event.comment.html_url,
          });
        })(),
      );
    }

    if (
      event.pull_request.user.login !== event.sender.login &&
      !mentions.includes(event.pull_request.user.login) &&
      (!isReply || !threadParticipants.includes(event.pull_request.user.login))
    ) {
      dmPromises.push(
        (async () => {
          const authorSlackId = await getSlackUserId(event.pull_request.user.login, args);
          if (!authorSlackId) {
            return;
          }

          const dmResult = await slackClient.postDirectMessage({
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

          await persistCommentDmMapping({
            dmResult,
            args,
            targetType: slackCommentDmTargetType.pullRequestReviewComment,
            repositoryFullName: event.repository.full_name,
            githubCommentId: event.comment.id,
            commentAuthorGithubUsername: event.comment.user.login,
            commentBody: event.comment.body,
            prTitle: event.pull_request.title,
            prNumber: event.pull_request.number,
            commentUrl: event.comment.html_url,
          });
        })(),
      );
    }

    if (isReply) {
      dmPromises.push(
        notifyThreadParticipants({
          participants: threadParticipants,
          event,
          slackClient,
          args,
        }),
      );
    }

    await Promise.all(dmPromises);

    const threadId = event.comment.in_reply_to_id ?? event.comment.id;
    await addReviewThreadParticipant({
      threadId,
      githubUsername: event.sender.login,
    });
  }
};

async function notifyThreadParticipants({
  participants,
  event,
  slackClient,
  args,
}: {
  participants: string[];
  event: PullRequestReviewCommentCreatedEvent;
  slackClient: SlackClient;
  args: Pick<
    BaseGithubWebhookEventHanderArgs,
    "organizationId" | "slackTeamId"
  >;
}): Promise<void> {
  const notifyPromises = participants
    .filter((username) => username !== event.sender.login)
    .map(async (username) => {
      const slackId = await getSlackUserId(username, args);
      if (!slackId) {
        return;
      }

      const dmResult = await slackClient.postDirectMessage({
        slackUserId: slackId,
        message: {
          text: `↩️ ${await getSlackUserName(event.sender.login, args)} replied to a thread you're in`,
          attachments: [
            getDmAttachment(
              {
                title: event.pull_request.title,
                number: event.pull_request.number,
                html_url: event.comment.html_url,
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

      await persistCommentDmMapping({
        dmResult,
        args,
        targetType: slackCommentDmTargetType.pullRequestReviewComment,
        repositoryFullName: event.repository.full_name,
        githubCommentId: event.comment.id,
        commentAuthorGithubUsername: event.comment.user.login,
        commentBody: event.comment.body,
        prTitle: event.pull_request.title,
        prNumber: event.pull_request.number,
        commentUrl: event.comment.html_url,
      });
    });

  await Promise.all(notifyPromises);
}
