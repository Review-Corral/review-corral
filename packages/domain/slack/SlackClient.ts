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
  CodedError,
  ErrorCode,
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
  getPrReopenedAttachment,
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
      this.logSlackError("Error posting message", error, payload);
    }
  }

  /**
   * Logs detailed Slack API error information based on error type.
   */
  private logSlackError(
    context: string,
    error: unknown,
    payload?: Record<string, unknown>,
  ): void {
    const isCodedError = (err: unknown): err is CodedError =>
      err instanceof Error && "code" in err;

    if (isCodedError(error)) {
      switch (error.code) {
        case ErrorCode.PlatformError:
          // Platform errors contain the Slack API error message (e.g., "invalid_blocks")
          LOGGER.error(context, {
            errorType: "PlatformError",
            code: error.code,
            slackError: (error as { data?: { error?: string } }).data?.error,
            message: error.message,
            payload,
          });
          break;

        case ErrorCode.HTTPError:
          LOGGER.error(context, {
            errorType: "HTTPError",
            code: error.code,
            statusCode: (error as { statusCode?: number }).statusCode,
            statusMessage: (error as { statusMessage?: string }).statusMessage,
            message: error.message,
            payload,
          });
          break;

        case ErrorCode.RateLimitedError:
          LOGGER.error(context, {
            errorType: "RateLimitedError",
            code: error.code,
            retryAfter: (error as { retryAfter?: number }).retryAfter,
            message: error.message,
          });
          break;

        case ErrorCode.RequestError:
          LOGGER.error(context, {
            errorType: "RequestError",
            code: error.code,
            originalError: (error as { original?: Error }).original?.message,
            message: error.message,
            payload,
          });
          break;

        default:
          LOGGER.error(context, {
            errorType: "UnknownCodedError",
            code: error.code,
            message: error.message,
            error,
            payload,
          });
      }
    } else {
      LOGGER.error(context, { error, payload }, { depth: 10 });
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
  }: {
    slackUserId: string;
    message: Omit<ChatPostMessageArguments, "token" | "channel">;
  }): Promise<ChatPostMessageResponse | undefined> {
    const conversationId = await this.openDirectMessage(slackUserId);
    if (!conversationId) {
      // Silently skip - error already logged in openDirectMessage
      return undefined;
    }

    const payload: ChatPostMessageArguments = {
      ...message,
      channel: conversationId,
      token: this.slackToken,
      mrkdwn: true,
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

  /**
   * Updates an existing direct message.
   * Returns true if successful, false otherwise.
   */
  async updateDirectMessage({
    channelId,
    messageTs,
    message,
  }: {
    channelId: string;
    messageTs: string;
    message: Omit<ChatPostMessageArguments, "token" | "channel">;
  }): Promise<boolean> {
    const payload = {
      ...message,
      channel: channelId,
      ts: messageTs,
      token: this.slackToken,
    };

    const result = await tryCatch(this.client.chat.update(payload));

    if (!result.ok) {
      this.logSlackError("Error updating DM", result.error, payload);
      return false;
    }

    return true;
  }

  async postPrMerged(
    args: MainMessageArgs<BasePullRequestProperties>,
    actionPerformerName: string,
  ) {
    await this.postMessage({
      message: {
        text: `Pull request merged by ${actionPerformerName}`,
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

  async postPrClosed(
    args: MainMessageArgs<PullRequestClosedEvent>,
    actionPerformerName: string,
  ) {
    await this.postMessage({
      message: {
        attachments: [getPrClosedAttatchment(actionPerformerName)],
      },
      threadTs: args.threadTs,
    });

    await this.updateMainMessage(args, "pr-closed");
  }

  async postPrReopened(
    args: MainMessageArgs<BasePullRequestProperties>,
    actionPerformerName: string,
  ) {
    await this.postMessage({
      message: {
        attachments: [getPrReopenedAttachment(actionPerformerName)],
      },
      threadTs: args.threadTs,
    });

    await this.updateMainMessage(args, "pr-reopened");
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
