import { COLOURS } from "@core/slack/const";
import {
  createIssueCommentReaction,
  createPullRequestReviewCommentReaction,
  deleteIssueCommentReaction,
  deletePullRequestReviewCommentReaction,
} from "@domain/github/fetchers";
import { Logger } from "@domain/logging";
import {
  getOrgMemberBySlackId,
  getOrgMemberByUsername,
} from "@domain/postgres/fetchers/members";
import { findSlackCommentDmMapping } from "@domain/postgres/fetchers/slack-comment-dm-mappings";
import { getSlackInstallationsForOrganization } from "@domain/postgres/fetchers/slack-integrations";
import {
  hasSlackEventBeenProcessed,
  markSlackEventProcessed,
} from "@domain/postgres/fetchers/slack-processed-events";
import {
  deleteSlackReactionMirror,
  findSlackReactionMirror,
  upsertSlackReactionMirror,
} from "@domain/postgres/fetchers/slack-reaction-mirrors";
import { SlackClient } from "../SlackClient";
import { getDmAttachment } from "../dmAttachments";

const LOGGER = new Logger("domain.slack.handlers.reactionEvent");

const GITHUB_REACTION_VALUES = [
  "+1",
  "-1",
  "laugh",
  "confused",
  "heart",
  "hooray",
  "rocket",
  "eyes",
] as const;

type GithubReactionContent = (typeof GITHUB_REACTION_VALUES)[number];

const slackToGithubReactionMap: Record<string, GithubReactionContent | undefined> = {
  "+1": "+1",
  thumbsup: "+1",
  "-1": "-1",
  thumbsdown: "-1",
  laughing: "laugh",
  joy: "laugh",
  confused: "confused",
  heart: "heart",
  tada: "hooray",
  rocket: "rocket",
  eyes: "eyes",
};

const githubReactionToEmoji: Record<GithubReactionContent, string> = {
  "+1": "👍",
  "-1": "👎",
  laugh: "😄",
  confused: "😕",
  heart: "❤️",
  hooray: "🎉",
  rocket: "🚀",
  eyes: "👀",
};

type SlackReactionEvent = {
  type: "reaction_added" | "reaction_removed";
  team_id: string;
  user: string;
  reaction: string;
  item_user?: string;
  item: {
    type: "message";
    channel: string;
    ts: string;
  };
};

export async function handleSlackReactionEvent({
  eventId,
  event,
}: {
  eventId: string;
  event: SlackReactionEvent;
}): Promise<void> {
  const wasProcessed = await hasSlackEventBeenProcessed(eventId);

  if (wasProcessed) {
    LOGGER.debug("Skipping duplicate Slack event", { eventId, eventType: event.type });
    return;
  }

  await syncSlackReactionEvent({ eventId, event });

  const wasFirstProcess = await markSlackEventProcessed({
    slackEventId: eventId,
    eventType: event.type,
  });

  if (!wasFirstProcess) {
    LOGGER.warn("Slack event was processed concurrently", {
      eventId,
      eventType: event.type,
    });
  }
}

async function syncSlackReactionEvent({
  eventId,
  event,
}: {
  eventId: string;
  event: SlackReactionEvent;
}): Promise<void> {
  if (event.item.type !== "message") {
    LOGGER.debug("Ignoring non-message reaction item", { eventId });
    return;
  }

  if (!event.item.channel.startsWith("D")) {
    LOGGER.debug("Ignoring non-DM reaction", { eventId, channel: event.item.channel });
    return;
  }

  const githubReaction = slackToGithubReactionMap[event.reaction];
  if (!githubReaction) {
    LOGGER.debug("ignored_unsupported_emoji", {
      eventId,
      reaction: event.reaction,
    });
    return;
  }

  const mapping = await findSlackCommentDmMapping({
    slackTeamId: event.team_id,
    slackChannelId: event.item.channel,
    slackMessageTs: event.item.ts,
  });

  if (!mapping) {
    LOGGER.debug("ignored_no_mapping", {
      eventId,
      channel: event.item.channel,
      messageTs: event.item.ts,
    });
    return;
  }

  const reactorMember = await getOrgMemberBySlackId({
    orgId: mapping.orgId,
    slackId: event.user,
  });

  if (!reactorMember?.ghAccessToken) {
    LOGGER.info("skipped_no_gh_token", {
      eventId,
      orgId: mapping.orgId,
      reactorSlackUserId: event.user,
    });
    return;
  }

  if (event.type === "reaction_added") {
    const reactionResponse =
      mapping.targetType === "issue_comment"
        ? await createIssueCommentReaction({
            owner: mapping.owner,
            repo: mapping.repo,
            commentId: String(mapping.githubCommentId),
            content: githubReaction,
            accessToken: reactorMember.ghAccessToken,
          })
        : await createPullRequestReviewCommentReaction({
            owner: mapping.owner,
            repo: mapping.repo,
            commentId: String(mapping.githubCommentId),
            content: githubReaction,
            accessToken: reactorMember.ghAccessToken,
          });

    if (!reactionResponse.wasCreated) {
      LOGGER.info("gh_sync_existing_reaction", {
        eventId,
        reaction: githubReaction,
        targetType: mapping.targetType,
        owner: mapping.owner,
        repo: mapping.repo,
        githubCommentId: mapping.githubCommentId,
      });
      return;
    }

    await upsertSlackReactionMirror({
      slackChannelId: event.item.channel,
      slackMessageTs: event.item.ts,
      reactorSlackUserId: event.user,
      emoji: githubReaction,
      targetType: mapping.targetType,
      owner: mapping.owner,
      repo: mapping.repo,
      githubCommentId: String(mapping.githubCommentId),
      githubReactionId: String(reactionResponse.reaction.id),
    });

    const commentAuthor = await getOrgMemberByUsername({
      orgId: mapping.orgId,
      githubUsername: mapping.commentAuthorGithubUsername,
    });

    if (!commentAuthor?.slackId || commentAuthor.slackId === event.user) {
      return;
    }

    const orgInstallations = await getSlackInstallationsForOrganization(mapping.orgId);
    const slackIntegration = orgInstallations.find(
      (integration) => integration.slackTeamId === mapping.slackTeamId,
    );

    if (!slackIntegration?.accessToken || !slackIntegration.channelId) {
      LOGGER.warn(
        "Unable to send reaction author DM due to missing integration fields",
        {
          eventId,
          orgId: mapping.orgId,
          slackTeamId: mapping.slackTeamId,
        },
      );
      return;
    }

    const slackClient = new SlackClient(
      slackIntegration.channelId,
      slackIntegration.accessToken,
    );
    await slackClient.postDirectMessage({
      slackUserId: commentAuthor.slackId,
      message: {
        text: `${githubReactionToEmoji[githubReaction]} <@${event.user}> reacted to your comment on ${mapping.prTitle}`,
        attachments: [
          getDmAttachment(
            {
              title: mapping.prTitle,
              number: mapping.prNumber,
              html_url: mapping.commentUrl,
            },
            "gray",
          ),
          ...(mapping.commentBody
            ? [
                {
                  text: mapping.commentBody,
                  color: COLOURS.gray,
                },
              ]
            : []),
        ],
      },
    });

    LOGGER.info("gh_sync_success_add", {
      eventId,
      reaction: githubReaction,
      targetType: mapping.targetType,
      owner: mapping.owner,
      repo: mapping.repo,
      githubCommentId: mapping.githubCommentId,
    });
    return;
  }

  const mirroredReaction = await findSlackReactionMirror({
    slackChannelId: event.item.channel,
    slackMessageTs: event.item.ts,
    reactorSlackUserId: event.user,
    emoji: githubReaction,
  });

  if (!mirroredReaction) {
    LOGGER.debug("ignored_remove_without_mirror", {
      eventId,
      reaction: githubReaction,
    });
    return;
  }

  if (mirroredReaction.targetType === "issue_comment") {
    await deleteIssueCommentReaction({
      owner: mirroredReaction.owner,
      repo: mirroredReaction.repo,
      commentId: mirroredReaction.githubCommentId,
      reactionId: mirroredReaction.githubReactionId,
      accessToken: reactorMember.ghAccessToken,
    });
  } else {
    await deletePullRequestReviewCommentReaction({
      owner: mirroredReaction.owner,
      repo: mirroredReaction.repo,
      commentId: mirroredReaction.githubCommentId,
      reactionId: mirroredReaction.githubReactionId,
      accessToken: reactorMember.ghAccessToken,
    });
  }

  await deleteSlackReactionMirror({
    slackChannelId: event.item.channel,
    slackMessageTs: event.item.ts,
    reactorSlackUserId: event.user,
    emoji: githubReaction,
  });

  LOGGER.info("gh_sync_success_remove", {
    eventId,
    reaction: githubReaction,
    targetType: mirroredReaction.targetType,
    owner: mirroredReaction.owner,
    repo: mirroredReaction.repo,
    githubCommentId: mirroredReaction.githubCommentId,
  });
}
