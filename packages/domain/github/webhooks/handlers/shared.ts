import { COLOURS } from "@core/slack/const";
import {
  ContextBlock,
  ImageElement,
  MessageAttachment,
  SectionBlock,
} from "@slack/web-api";
import slackifyMarkdown from "slackify-markdown";
import { getOrgMemberByUsername } from "../../../postgres/fetchers/members";
import { BaseGithubWebhookEventHanderArgs } from "../types";

export async function getSlackUserName(
  githubLogin: string,
  props: Pick<BaseGithubWebhookEventHanderArgs, "organizationId">,
): Promise<string> {
  const slackId = await getSlackUserId(githubLogin, props);

  if (slackId) {
    return `<@${slackId}>`;
  }

  return githubLogin;
}

/**
 * Gets just the Slack user ID (not the mention format) for a GitHub username.
 * Returns null if the user is not found or has no Slack ID.
 */
export async function getSlackUserId(
  githubLogin: string,
  props: Pick<BaseGithubWebhookEventHanderArgs, "organizationId">,
): Promise<string | null> {
  const member = await getOrgMemberByUsername({
    orgId: props.organizationId,
    githubUsername: githubLogin,
  });

  return member?.slackId ?? null;
}

/**
 * Extracts GitHub username mentions (@username) from a comment body
 */
export function extractMentions(commentBody: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const mentions: string[] = [];
  let match: RegExpExecArray | null = null;

  while ((match = mentionRegex.exec(commentBody)) !== null) {
    mentions.push(match[1]);
  }

  return mentions;
}

export function getDmAttachment(
  pr: {
    title: string;
    number: number;
    html_url: string;
  },
  colour: keyof typeof COLOURS,
): MessageAttachment {
  return {
    color: COLOURS[colour],
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${pr.title} #${pr.number}`,
        },
      },

      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View",
            },
            url: pr.html_url,
          },
        ],
      },
    ],
  };
}

/**
 * Creates a rich attachment for review request DMs, similar to main PR messages.
 * Includes PR description, repo info, author, code stats, and target branch.
 */
export function getReviewRequestDmAttachment(
  pr: {
    title: string;
    number: number;
    html_url: string;
    body: string | null;
    additions: number;
    deletions: number;
    base: { ref: string };
    user: { avatar_url: string };
  },
  repository: {
    full_name: string;
    owner: { avatar_url: string };
  },
  authorSlackUsername: string,
  colour: keyof typeof COLOURS,
): MessageAttachment {
  return {
    color: COLOURS[colour],
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${pr.title} #${pr.number}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View",
            },
            url: pr.html_url,
          },
        ],
      },
      ...(pr.body
        ? [
            {
              type: "divider",
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: slackifyMarkdown(pr.body),
              },
            } as SectionBlock,
          ]
        : []),
      {
        type: "context",
        elements: [
          {
            type: "image",
            image_url: repository.owner.avatar_url,
            alt_text: "repo owner",
          },
          {
            type: "mrkdwn",
            text: repository.full_name,
          },
          {
            type: "image",
            image_url: pr.user.avatar_url,
            alt_text: "author",
          },
          {
            type: "mrkdwn",
            text: authorSlackUsername,
          },
          {
            type: "image",
            image_url: "https://cdn-icons-png.flaticon.com/512/9296/9296948.png",
            alt_text: "plus-minus-icon",
          } as ImageElement,
          {
            type: "mrkdwn",
            text: `+${pr.additions}-${pr.deletions}`,
          },
          {
            type: "mrkdwn",
            text: `:dart: ${pr.base.ref}`,
          },
        ],
      } as ContextBlock,
    ],
  };
}
