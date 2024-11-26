import { PullRequestItem } from "@core/dynamodb/entities/types";
import { MessageAttachment, SectionBlock } from "@slack/web-api";
import { ContextBlock, ImageElement } from "@slack/web-api";
import slackifyMarkdown from "slackify-markdown";
import { BasePullRequestProperties } from "./SlackClient";

/**
 * Wrapping in it's own type just so that this ins't confused as being the same thing
 * as PullRequestItem.requiredApprovals. This is the response we get by querying from
 * dynamo or the GH API before we've created the PR item.
 */
export type RequiredApprovalsQueryPayloadArg = {
  count: number;
} | null;

export type MainMessageArgs<T extends BasePullRequestProperties> = {
  body: T;
  threadTs: string; // TODO: Get this from the pr item (need to assert it exists tho)
  slackUsername: string;
  pullRequestItem: PullRequestItem | null;
  requiredApprovals: RequiredApprovalsQueryPayloadArg;
};

/**
 * Handles building the attachments for the main message, since all updates need to
 * include the same base attachments (updating without an attachment that existed
 * before will remove it)
 */
export const getBaseChatUpdateArguments = async ({
  body,
  threadTs,
  slackUsername,
  pullRequestItem,
  requiredApprovals,
}: MainMessageArgs<BasePullRequestProperties>): Promise<{
  ts: string;
  text: string;
  attachments: MessageAttachment[];
}> => {
  return {
    ts: threadTs,
    text: await getPrOpenedMessage(slackUsername),
    attachments: buidMainMessageAttachements({
      body,
      slackUsername,
      pullRequestItem,
      requiredApprovals,
    }),
  };
};

export const buidMainMessageAttachements = ({
  body,
  slackUsername,
  pullRequestItem,
  requiredApprovals,
}: {
  body: BasePullRequestProperties;
  slackUsername: string;
  pullRequestItem: PullRequestItem | null;
  requiredApprovals: RequiredApprovalsQueryPayloadArg;
}) => {
  const base = [
    getPrOpenedBaseAttachment(body, slackUsername),
    ...buildRequiredApprovalsAttachment({ pullRequestItem, requiredApprovals }),
  ];

  if (body.pull_request.draft) {
    return [...base, getConvertedToDraftAttachment()];
  }

  if (body.pull_request.merged) {
    return [...base, getMergedAttachment()];
  }

  if (body.pull_request.closed_at) {
    return [...base, getPrClosedAttatchment(slackUsername)];
  }

  return base;
};

export function getMergedAttachment(): MessageAttachment {
  return {
    color: "#8839FB",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":large_purple_circle: Pull request merged",
        },
      },
    ],
  };
}

export function getConvertedToDraftAttachment(
  text = "Pull request converted back to draft",
): MessageAttachment {
  return {
    color: "#D9CD27",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:construction: ${text}`,
        },
      },
    ],
  };
}

export function getPrClosedAttatchment(slackUsername: string): MessageAttachment {
  return {
    color: "#FB0909",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:red_circle: Pull request closed by ${slackUsername}`,
        },
      },
    ],
  };
}

const buildRequiredApprovalsAttachment = ({
  pullRequestItem,
  requiredApprovals,
}: {
  pullRequestItem: PullRequestItem | null;
  requiredApprovals: RequiredApprovalsQueryPayloadArg;
}) => {
  console.log("pullRequestItem", pullRequestItem);
  console.log("requiredApprovals", requiredApprovals);
  if (pullRequestItem?.requiredApprovals) {
    return [
      getRequiredApprovalsAttatchment({
        requiredApprovals: pullRequestItem.requiredApprovals,
        approvalCount: pullRequestItem.approvalCount ?? 0,
      }),
    ];
  } else if (requiredApprovals) {
    return [
      getRequiredApprovalsAttatchment({
        requiredApprovals: requiredApprovals.count,
        approvalCount: 0,
      }),
    ];
  }

  return [];
};

const getRequiredApprovalsAttatchment = ({
  requiredApprovals,
  approvalCount,
}: {
  requiredApprovals: number;
  approvalCount: number;
}): MessageAttachment => {
  if (approvalCount >= requiredApprovals) {
    return {
      color: "#03BB00",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:white_check_mark: ${approvalCount}/${requiredApprovals} approvals met`,
          },
        },
      ],
    };
  }

  return {
    color: "#35373B",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:ballot_box_with_check: ${approvalCount}/${requiredApprovals} approvals met`,
        },
      },
    ],
  };
};

const getPrOpenedBaseAttachment = (
  body: BasePullRequestProperties,
  slackUsername: string,
): MessageAttachment => {
  return {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${body.pull_request.title} #${body.pull_request.number}`,
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
            url: body.pull_request.html_url,
          },
        ],
      },
      ...(body.pull_request?.body
        ? [
            {
              type: "divider",
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: slackifyMarkdown(body.pull_request.body),
              },
            } as SectionBlock,
          ]
        : []),
      {
        type: "context",
        elements: [
          {
            type: "image",
            image_url: body.repository.owner.avatar_url,
            alt_text: "repo owner url",
          },
          {
            type: "mrkdwn",
            text: `${body.repository.full_name}`,
          },
          {
            type: "image",
            image_url: body.pull_request.user.avatar_url,
            alt_text: "user url",
          },
          {
            type: "mrkdwn",
            text: `${slackUsername}`,
          },
          {
            type: "image",
            // For whatever reason, Slack won't use the image at
            // https://reviewcorral.com/plus-minus-diff-icon-alt.png
            // it seems likely it's due to the domain not being whitelisted by Slack.
            // Using this as a fallback for now.
            image_url: "https://cdn-icons-png.flaticon.com/512/9296/9296948.png",
            alt_text: "plus-minus-icon",
          } as ImageElement,
          {
            type: "mrkdwn",
            text: `+${body.pull_request.additions.toLocaleString()}-${body.pull_request.deletions.toLocaleString()}`,
          },
          {
            type: "mrkdwn",
            text: `:dart: ${body.pull_request.base.ref}`,
          },
        ],
      } as ContextBlock,
    ],
  };
};

async function getPrOpenedMessage(slackUsername: string): Promise<string> {
  return `Pull request opened by ${slackUsername}`;
}
