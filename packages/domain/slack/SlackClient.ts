import {
  PullRequestClosedEvent,
  PullRequestEvent,
  PullRequestOpenedEvent,
  PullRequestReadyForReviewEvent,
  PullRequestReview,
} from "@octokit/webhooks-types";
import {
  ChatPostMessageArguments,
  ChatPostMessageResponse,
  ChatUpdateArguments,
  ContextBlock,
  ImageElement,
  MessageAttachment,
  SectionBlock,
  WebClient,
} from "@slack/web-api";
import slackifyMarkdown from "slackify-markdown";
import { Logger } from "../logging";
import { PullRequestItem } from "@core/dynamodb/entities/types";

export type PullRequestEventOpenedOrReadyForReview =
  | PullRequestOpenedEvent
  | PullRequestReadyForReviewEvent;

const LOGGER = new Logger("core.SlackClient");

export type BasePullRequestProperties = {
  pull_request: {
    title: string;
    number: number;
    html_url: string;
    body: string | null;
    user: {
      avatar_url: string;
      login: string;
    };
    additions: number;
    deletions: number;
    base: {
      ref: string;
    };
  };
  repository: {
    full_name: string;
    owner: {
      avatar_url: string;
    };
  };
};

export class SlackClient {
  readonly client: WebClient;

  constructor(
    readonly channelId: string,
    readonly slackToken: string,
  ) {
    this.client = new WebClient(this.slackToken);
  }

  async postMessage({
    message,
    threadTs,
  }: {
    message: Omit<ChatPostMessageArguments, "token" | "channel">;
    threadTs: string | undefined;
  }): Promise<ChatPostMessageResponse | undefined> {
    const payload = {
      ...message,
      thread_ts: threadTs,
      channel: this.channelId,
      token: this.slackToken,
      mrkdwn: true,
    };
    try {
      return await this.client.chat.postMessage(payload);
    } catch (error) {
      LOGGER.error(
        "Error posting message: ",
        {
          error,
          payload,
        },
        { depth: 10 },
      );
    }
  }

  async postPrMerged(
    body: PullRequestClosedEvent,
    threadTs: string,
    slackUsername: string,
  ) {
    await this.postMessage({
      message: {
        text: `Pull request merged by ${slackUsername}`,
        attachments: [this.getMergedAttachment()],
      },
      threadTs,
    });

    if (threadTs) {
      console.debug(
        `Going to update message ts: ${threadTs} for channel ${this.channelId}`,
      );
      const payload: ChatUpdateArguments = {
        channel: this.channelId,
        ts: threadTs,
        token: this.slackToken,
        text: await this.getPrOpenedMessage(slackUsername),
        attachments: [
          await this.getPrOpenedBaseAttachment(body, slackUsername),
          this.getMergedAttachment(),
        ],
      };

      LOGGER.debug("Payload: ", payload);

      try {
        await this.client.chat.update(payload);
        LOGGER.debug("Succesfully updated message with merged status");
      } catch (error) {
        LOGGER.error("Got error updating thread with merged status: ", error);
      }
    }
  }

  async postConvertedToDraft(
    body: PullRequestEvent,
    threadTs: string,
    slackUsername: string,
    pullRequestItem: PullRequestItem,
  ) {
    await this.postMessage({
      message: {
        text: "Pull request converted to draft",
        attachments: [this.getConvertedToDraftAttachment()],
      },
      threadTs,
    });

    LOGGER.debug(
      `Going to update message ts: ${threadTs} for channel ${this.channelId}`,
    );

    const defaultPayload = await this.getBaseChatUpdateArguments({
      body,
      threadTs,
      slackUsername,
      pullRequestItem,
    });

    try {
      await this.client.chat.update({
        ...defaultPayload,
        attachments: [
          ...(defaultPayload.attachments || []),
          this.getConvertedToDraftAttachment("Pull request marked as draft"),
        ],
      });
      LOGGER.debug("Succesfully updated message with converted to draft status");
    } catch (error) {
      LOGGER.error("Got error updating thread with converted to draft status: ", error);
    }
  }

  async postReadyForReview({
    body,
    threadTs,
    slackUsername,
    pullRequestItem,
  }: {
    body: PullRequestEvent;
    threadTs: string;
    slackUsername: string;
    pullRequestItem: PullRequestItem | null;
  }) {
    await this.postMessage({
      message: {
        text: "Draft status removed",
        attachments: [
          {
            color: "#02A101",
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: ":large_green_circle: Pull request is now ready for review",
                },
              },
            ],
          },
        ],
      },
      threadTs,
    });

    LOGGER.debug(
      `Going to update message ts: ${threadTs} for channel ${this.channelId}`,
    );

    const defaultPayload = await this.getBaseChatUpdateArguments({
      body,
      threadTs,
      slackUsername,
      pullRequestItem,
    });

    try {
      await this.client.chat.update(defaultPayload);
      LOGGER.debug("Succesfully updated message with ready for review status");
    } catch (error) {
      LOGGER.error("Got error updating thread with ready for review status: ", error);
    }
  }

  async updateMainPrMessage({
    body,
    threadTs,
    slackUsername,
    pullRequestItem,
  }: {
    body: BasePullRequestProperties;
    threadTs: string;
    slackUsername: string;
    pullRequestItem: PullRequestItem;
  }) {
    LOGGER.info(
      `Going to update message ts: ${threadTs} for channel ${this.channelId}`,
    );

    const defaultPayload = await this.getBaseChatUpdateArguments({
      body,
      threadTs,
      slackUsername,
      pullRequestItem,
    });

    try {
      await this.client.chat.update(defaultPayload);
      LOGGER.info("Succesfully updated message");
    } catch (error) {
      LOGGER.error("Got error updating message", { error });
    }
  }

  getBaseChatUpdateArguments = async ({
    body,
    threadTs,
    slackUsername,
    pullRequestItem,
  }: {
    body: BasePullRequestProperties;
    threadTs: string;
    slackUsername: string;
    pullRequestItem: PullRequestItem | null;
  }): Promise<ChatUpdateArguments> => ({
    channel: this.channelId,
    ts: threadTs,
    token: this.slackToken,
    text: await this.getPrOpenedMessage(slackUsername),
    attachments: [
      this.getPrOpenedBaseAttachment(body, slackUsername),
      ...(pullRequestItem?.requiredApprovals && pullRequestItem.approvalCount
        ? [
            this.getRequiredApprovalsAttatchment({
              requiredApprovals: pullRequestItem.requiredApprovals,
              approvalCount: pullRequestItem.approvalCount,
            }),
          ]
        : []),
    ],
  });

  async postComment({
    commentBody,
    commentUrl,
    threadTs,
    slackUsername,
  }: {
    prId: number;
    commentBody: string;
    commentUrl: string | undefined;
    threadTs: string;
    slackUsername: string;
  }) {
    await this.postMessage({
      message: {
        text: commentUrl
          ? `${slackUsername} left <${commentUrl}|a comment>`
          : `${slackUsername} left a pull request comment`,
        attachments: [
          {
            text: slackifyMarkdown(commentBody),
          },
        ],
      },
      threadTs,
    });
  }

  async postPrClosed(
    body: PullRequestClosedEvent,
    threadTs: string,
    slackUsername: string,
    pullRequestItem: PullRequestItem,
  ) {
    await this.postMessage({
      message: {
        attachments: [this.getPrClosedAttatchment(slackUsername)],
      },
      threadTs,
    });

    const defaultPayload = await this.getBaseChatUpdateArguments({
      body,
      threadTs,
      slackUsername,
      pullRequestItem,
    });

    try {
      await this.client.chat.update({
        ...defaultPayload,
        attachments: [
          ...(defaultPayload.attachments || []),
          this.getPrClosedAttatchment(slackUsername),
        ],
      });
      console.debug("Succesfully updated message with closed pr status");
    } catch (error) {
      console.error("Got error updating thread with closed pr status: ", error);
    }
  }

  async postReviewRequested(
    _body: PullRequestClosedEvent,
    threadTs: string,
    slackUsername: string,
  ) {
    return await this.postMessage({
      message: {
        attachments: [
          {
            color: "#FB0909",
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `Pull request closed by ${slackUsername}`,
                },
              },
            ],
          },
        ],
      },
      threadTs,
    });
  }

  async postReview(
    _prId: number,
    review: PullRequestReview,
    _login: string,
    threadTs: string,
    slackUsername: string,
  ) {
    const getReviewText = (review: PullRequestReview) => {
      switch (review.state) {
        case "approved": {
          return "approved the pull request";
        }
        case "changes_requested": {
          return "requested changes to the pull request";
        }
        case "commented": {
          return "left a review comment on the pull request";
        }
      }
    };

    return await this.postMessage({
      message: {
        text: `${slackUsername} ${getReviewText(review)}`,
        attachments: [
          {
            text: slackifyMarkdown(review.body ?? ""),
            color: "#fff",
          },
          ...[
            review.state === "approved" && {
              text: ":white_check_mark:",
              color: "#00BB00",
            },
          ],
        ],
      },
      threadTs,
    });
  }

  private async getPrOpenedMessage(slackUsername: string): Promise<string> {
    return `Pull request opened by ${slackUsername}`;
  }

  private getRequiredApprovalsAttatchment({
    requiredApprovals,
    approvalCount,
  }: {
    requiredApprovals: number;
    approvalCount: number;
  }): MessageAttachment {
    if (approvalCount >= requiredApprovals) {
      return {
        color: "#03BB00",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `:bust_in_silhouette: ${approvalCount}/${requiredApprovals} approvals required`,
            },
          },
        ],
      };
    }

    return {
      color: "#D9CD27",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:bust_in_silhouette: ${approvalCount}/${requiredApprovals} approvals required`,
          },
        },
      ],
    };
  }

  private getPrOpenedBaseAttachment(
    body: BasePullRequestProperties,
    slackUsername: string,
  ): MessageAttachment {
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
              text: `+${body.pull_request.additions}-${body.pull_request.deletions}`,
            },
            {
              type: "mrkdwn",
              text: `:dart: ${body.pull_request.base.ref}`,
            },
          ],
        } as ContextBlock,
      ],
    };
  }

  async postPrReady(
    body: PullRequestEventOpenedOrReadyForReview,
    slackUsername: string,
  ): Promise<ChatPostMessageResponse | undefined> {
    try {
      return this.postMessage({
        message: {
          text: await this.getPrOpenedMessage(slackUsername),
          attachments: [await this.getPrOpenedBaseAttachment(body, slackUsername)],
        },
        threadTs: undefined,
      });
    } catch (error) {
      console.error("Got error posting to channel: ", error);
    }
  }

  private getMergedAttachment(): MessageAttachment {
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

  private getConvertedToDraftAttachment(
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

  private getPrClosedAttatchment(slackUsername: string): MessageAttachment {
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
}
