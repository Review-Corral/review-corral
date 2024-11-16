import { PullRequestItem } from "@core/dynamodb/entities/types";
import { convertPrEventToBaseProps } from "@domain/github/webhooks/handlers/utils";
import {
  PullRequestClosedEvent,
  PullRequestOpenedEvent,
  PullRequestReadyForReviewEvent,
  PullRequestReview,
} from "@octokit/webhooks-types";
import {
  ChatPostMessageArguments,
  ChatPostMessageResponse,
  ChatUpdateArguments,
  WebClient,
} from "@slack/web-api";
import slackifyMarkdown from "slackify-markdown";
import { Logger } from "../logging";
import {
  MainMessageArgs,
  RequiredApprovalsQueryPayloadArg,
  buidMainMessageAttachements,
  getBaseChatUpdateArguments,
  getConvertedToDraftAttachment,
  getMergedAttachment,
  getPrClosedAttatchment,
} from "./mainMessage";

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
    merged: boolean;
    draft: boolean;
    /**
     * If this is NOT null but merged is false, then it's a closed PR
     */
    closed_at: string | null;
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

  // TODO: Ideally this is private
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

  async postPrMerged(args: MainMessageArgs<BasePullRequestProperties>) {
    await this.postMessage({
      message: {
        text: `Pull request merged by ${args.slackUsername}`,
        attachments: [getMergedAttachment()],
      },
      threadTs: args.threadTs,
    });

    await this.updateMainMessage(args, "pr-merged");
  }

  async postConvertedToDraft(args: MainMessageArgs<BasePullRequestProperties>) {
    await this.postMessage({
      message: {
        text: "Pull request converted to draft",
        attachments: [getConvertedToDraftAttachment()],
      },
      threadTs: args.threadTs,
    });

    await this.updateMainMessage(args, "pr-converted-to-draft");
  }

  async postReadyForReview(args: MainMessageArgs<BasePullRequestProperties>) {
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
      threadTs: args.threadTs,
    });

    await this.updateMainMessage(args, "pr-ready");
  }

  // TODO: where this used?
  async updateMainPrMessage(args: MainMessageArgs<BasePullRequestProperties>) {
    await this.updateMainMessage(args, "update");
  }

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

  async getBaseMessageArgsWithToken(
    args: MainMessageArgs<BasePullRequestProperties>,
  ): Promise<ChatUpdateArguments> {
    return {
      token: this.slackToken,
      channel: this.channelId,
      ...(await getBaseChatUpdateArguments(args)),
    };
  }

  async postPrClosed(args: MainMessageArgs<PullRequestClosedEvent>) {
    await this.postMessage({
      message: {
        attachments: [getPrClosedAttatchment(args.slackUsername)],
      },
      threadTs: args.threadTs,
    });

    await this.updateMainMessage(args, "pr-closed");
  }

  async updateMainMessage(
    args: MainMessageArgs<BasePullRequestProperties>,
    eventName: string,
  ) {
    try {
      await this.client.chat.update(await this.getBaseMessageArgsWithToken(args));
      LOGGER.debug(`Succesfully updated main message for ${eventName}`);
    } catch (error) {
      LOGGER.error(`Got error updating main message for ${eventName}: `, error);
    }
  }

  async postReviewRequested({
    threadTs,
    slackUsername,
  }: MainMessageArgs<PullRequestClosedEvent>) {
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

  async postReview({
    review,
    threadTs,
    slackUsername,
  }: {
    review: PullRequestReview;
    threadTs: string;
    slackUsername: string;
  }) {
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

  async postPrReady({
    body,
    pullRequestItem,
    slackUsername,
    requiredApprovals,
  }: {
    body: PullRequestEventOpenedOrReadyForReview;
    pullRequestItem: PullRequestItem | null;
    slackUsername: string;
    requiredApprovals: RequiredApprovalsQueryPayloadArg;
  }): Promise<ChatPostMessageResponse | undefined> {
    try {
      return this.postMessage({
        message: {
          text: await this.getPrOpenedMessage(slackUsername),
          attachments: buidMainMessageAttachements({
            body: convertPrEventToBaseProps(body),
            slackUsername,
            pullRequestItem,
            requiredApprovals,
          }),
        },
        threadTs: undefined,
      });
    } catch (error) {
      console.error("Got error posting to channel: ", error);
    }
  }
}
