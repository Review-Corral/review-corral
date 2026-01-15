import { COLOURS } from "@core/slack/const";
import {
  ContextBlock,
  ImageElement,
  MessageAttachment,
  SectionBlock,
} from "@slack/web-api";
import slackifyMarkdown from "slackify-markdown";

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
