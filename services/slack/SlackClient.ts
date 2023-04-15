import {
  PullRequestClosedEvent,
  PullRequestEvent,
  PullRequestReview,
} from "@octokit/webhooks-types";
import {
  ChatPostMessageArguments,
  ChatPostMessageResponse,
  ChatUpdateArguments,
  MessageAttachment,
  WebClient,
} from "@slack/web-api";
import { PullRequestReadyEvent } from "services/github/GithubEventHandler";
import slackifyMarkdown from "slackify-markdown";

export const getSlackWebClient = () =>
  new WebClient(process.env.SLACK_BOT_TOKEN);

export class SlackClient {
  readonly client: WebClient;

  constructor(readonly channelId: string, readonly slackToken: string) {
    this.client = new WebClient(process.env.SLACK_BOT_TOKEN);
  }

  async postMessage({
    message,
    threadTs,
  }: {
    message: Omit<ChatPostMessageArguments, "token" | "channel">;
    prId: number;
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
      console.error("Error posting message: ", error);
    }
  }

  async postPrMerged(
    prId: number,
    body: PullRequestClosedEvent,
    threadTs: string,
    slackUsername: string,
  ) {
    await this.postMessage({
      message: {
        text: `Pull request merged by ${slackUsername}`,
        attachments: [this.getMergedAttachment(false)],
      },
      prId,
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
        text: await this.getPrOpenedMessage(body, slackUsername),
        attachments: [
          await this.getPrOpenedBaseAttachment(body, slackUsername),
          this.getMergedAttachment(true),
        ],
      };

      try {
        await this.client.chat.update(payload);
        console.debug("Succesfully updated message with merged status");
      } catch (error) {
        console.error("Got error updating thread with merged status: ", error);
      }
    }
  }

  async postComment({
    prId,
    commentBody,
    commentUrl,
    threadTs,
    slackUsername,
  }: {
    prId: number;
    commentBody: string;
    commentUrl: string;
    threadTs: string;
    slackUsername: string;
  }) {
    await this.postMessage({
      message: {
        text: `${slackUsername} left <${commentUrl}|a comment>`,
        attachments: [
          {
            text: slackifyMarkdown(commentBody),
          },
        ],
      },
      prId,
      threadTs,
    });
  }

  async postPrClosed(
    prId: number,
    body: PullRequestClosedEvent,
    threadTs: string,
    slackUsername: string,
  ) {
    await this.postMessage({
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
      prId,
      threadTs,
    });
  }

  async postReview(
    prId: number,
    review: PullRequestReview,
    login: string,
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

    await this.postMessage({
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
      prId,
      threadTs,
    });
  }

  private async getPrOpenedMessage(
    body: PullRequestEvent,
    slackUsername: string,
  ): Promise<string> {
    return `Pull request opened by ${slackUsername}`;
  }

  private async getPrOpenedBaseAttachment(
    body: PullRequestEvent,
    slackUsername: string,
  ) {
    return {
      // color: "#106D04",
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
        ...(!!body.pull_request?.body
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
              },
            ]
          : []),
        {
          type: "context",
          elements: [
            {
              type: "image",
              image_url: body.repository?.owner?.avatar_url,
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
              image_url: `${process.env.NEXT_PUBLIC_BASE_URL}/plus-minus-diff-icon-alt.png`,
              alt_text: "plus-minus-icon",
            },
            {
              type: "mrkdwn",
              text: `+${body.pull_request.additions}-${body.pull_request.deletions}`,
            },
            {
              type: "mrkdwn",
              text: `:dart: ${body.pull_request.base.ref}`,
            },
          ],
        },
      ],
    };
  }

  async postReadyForReview({
    prId,
    threadTs,
  }: {
    prId: number;
    threadTs: string;
  }) {
    await this.postMessage({
      message: {
        text: `Pull request marked ready for review`,
      },
      prId,
      threadTs,
    });
  }

  async postPrReady(
    prId: number,
    body: PullRequestReadyEvent,
    slackUsername: string,
  ): Promise<ChatPostMessageResponse | undefined> {
    try {
      return this.postMessage({
        message: {
          text: await this.getPrOpenedMessage(body, slackUsername),
          attachments: [
            await this.getPrOpenedBaseAttachment(body, slackUsername),
          ],
        },
        prId,
        threadTs: undefined,
      });
    } catch (error) {
      console.error("Got error posting to channel: ", error);
    }
  }

  private getMergedAttachment(showMergedText: boolean): MessageAttachment {
    return {
      color: "#8839FB",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:large_purple_circle: Pull request merged`,
          },
        },
      ],
    };
  }
}
