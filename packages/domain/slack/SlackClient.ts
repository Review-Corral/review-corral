import { tryCatch } from "@core/utils/errors/tryCatch";
import { convertPrEventToBaseProps } from "@domain/github/webhooks/handlers/utils";
import { type PullRequest } from "@domain/postgres/schema";
import {
  PullRequestClosedEvent,
  PullRequestOpenedEvent,
  PullRequestReadyForReviewEvent,
} from "@octokit/webhooks-types";
import {
  ChatPostMessageArguments,
  ChatPostMessageResponse,
  ChatUpdateArguments,
  MessageAttachment,
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
  // Cache for DM conversation IDs to avoid rate limiting
  private dmConversationCache = new Map<string, string>();

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

  /**
   * Opens a DM conversation with a Slack user.
   * Uses caching to avoid rate limiting on repeated calls.
   */
  private async openDirectMessage(slackUserId: string): Promise<string | null> {
    // Check cache first
    const cached = this.dmConversationCache.get(slackUserId);
    if (cached) {
      return cached;
    }

    const result = await tryCatch(
      this.client.conversations.open({
        users: slackUserId,
      }),
    );

    if (!result.ok) {
      LOGGER.error("Error opening DM conversation", {
        error: result.error,
        slackUserId,
      });
      return null;
    }

    if (result.data.channel?.id) {
      // Cache the conversation ID
      this.dmConversationCache.set(slackUserId, result.data.channel.id);
      return result.data.channel.id;
    }

    LOGGER.error("Failed to open DM: no channel ID returned", {
      slackUserId,
    });
    return null;
  }

  /**
   * Sends a direct message to a Slack user.
   * Silently fails (with logging) if the DM cannot be sent.
   */
  async postDirectMessage({
    slackUserId,
    message,
    attachments,
  }: {
    slackUserId: string;
    message: Omit<ChatPostMessageArguments, "token" | "channel">;
    attachments?: MessageAttachment[];
  }): Promise<ChatPostMessageResponse | undefined> {
    const conversationId = await this.openDirectMessage(slackUserId);
    if (!conversationId) {
      // Silently skip - error already logged in openDirectMessage
      return undefined;
    }

    const payload = {
      ...message,
      channel: conversationId,
      token: this.slackToken,
      mrkdwn: true,
      attachments,
    };

    const result = await tryCatch(this.client.chat.postMessage(payload));

    if (!result.ok) {
      LOGGER.error("Error posting DM", {
        error: result.error,
        slackUserId,
        payload,
      });
      return undefined;
    }

    return result.data;
  }

  async postPrMerged(
    args: MainMessageArgs<BasePullRequestProperties>,
    actionPerformerUsername: string,
  ) {
    await this.postMessage({
      message: {
        text: `Pull request merged by ${actionPerformerUsername}`,
        attachments: [getMergedAttachment()],
      },
      threadTs: args.threadTs,
    });

    await this.updateMainMessage(args, "pr-merged", actionPerformerUsername);
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
    actionPerformerUsername?: string,
  ): Promise<ChatUpdateArguments> {
    return {
      token: this.slackToken,
      channel: this.channelId,
      ...(await getBaseChatUpdateArguments(args, actionPerformerUsername)),
    };
  }

  async postPrClosed(
    args: MainMessageArgs<PullRequestClosedEvent>,
    actionPerformerUsername: string,
  ) {
    await this.postMessage({
      message: {
        attachments: [getPrClosedAttatchment(actionPerformerUsername)],
      },
      threadTs: args.threadTs,
    });

    await this.updateMainMessage(args, "pr-closed", actionPerformerUsername);
  }

  async updateMainMessage(
    args: MainMessageArgs<BasePullRequestProperties>,
    eventName: string,
    actionPerformerUsername?: string,
  ) {
    try {
      await this.client.chat.update(
        await this.getBaseMessageArgsWithToken(args, actionPerformerUsername),
      );
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

  private async getPrOpenedMessage(slackUsername: string): Promise<string> {
    return `Pull request opened by ${slackUsername}`;
  }

  /**
   * Called when are first writing the main message for a PR to the channel
   */
  async postPrReady({
    body,
    pullRequestItem,
    slackUsername,
    requiredApprovals,
  }: {
    body: PullRequestEventOpenedOrReadyForReview;
    pullRequestItem: PullRequest | null;
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
}
