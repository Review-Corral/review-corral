import {
  ChatPostMessageArguments,
  ChatPostMessageResponse,
  ChatUpdateArguments,
  MessageAttachment,
  WebClient,
} from "@slack/web-api";
import { SupabaseClient } from "@supabase/supabase-js";
import axios from "axios";
import { Logger } from "next-axiom";
import { Database } from "../../../../database-types";
import {
  GithubEvent,
  PullRequestComment,
  Review,
} from "../../../../github-event-types";
import { getInstallationAccessToken } from "../../utils/apiUtils";

// TODO: remove this comment
export class GithubEventHandler {
  constructor(
    private readonly supabaseClient: SupabaseClient<Database>,
    private readonly slackClient: WebClient,
    private readonly channelId: string,
    private readonly slackToken: string,
    private readonly installationId: number,
    private readonly logger: Logger,
    private readonly organizationId: string,
  ) {}

  async handleEvent(body: GithubEvent) {
    const prId = body.pull_request.id;

    // New PR, should be the only two threads that create a new thread
    if (
      ((body.action === "opened" && body.pull_request?.draft === false) ||
        body.action === "ready_for_review") &&
      body.pull_request
    ) {
      this.logger.debug("Handling new PR");
      await this.handleNewPr(prId, body);
    } else {
      this.logger.debug("Handling different event");
      await this.handleOtherEvent(body, prId);
    }
  }

  private async handleNewPr(prId: number, body: GithubEvent) {
    const threadTs = (await this.postPrOpened(prId, body))?.ts;

    if (threadTs) {
      // Get all comments and post
      const accessToken = await getInstallationAccessToken(this.installationId);

      try {
        const response = await axios.get<PullRequestComment[]>(
          body.pull_request.comments_url,
          {
            headers: {
              Authorization: `bearer ${accessToken.token}`,
            },
          },
        );

        response.data.forEach((comment) => {
          if (comment.user.type === "User") {
            this.postComment({
              prId,
              commentBody: comment.body,
              commentUrl: comment.url,
              login: comment.user.login,
              threadTs: threadTs,
            });
          }
        });
      } catch (error) {
        this.logger.error("Error getting comments: ", error);
      }

      // Get all requested Reviews and post
      if (body.pull_request.requested_reviewers) {
        body.pull_request.requested_reviewers.map(
          async (requested_reviewer) => {
            await this.postMessage({
              message: {
                text: `Review request for ${await this.getSlackUserName(
                  requested_reviewer.login,
                )}`,
              },
              prId,
              threadTs: threadTs,
            });
          },
        );
      }
    } else {
      this.logger.error(
        "Error posting new thread for PR opened message to Slack: Didn't get message response back to thread messages PR ID: ",
        { prId: prId },
      );
    }
  }

  private async handleOtherEvent(body: GithubEvent, prId: number) {
    const threadTs = await this.getThreadTs(prId);

    if (!threadTs) {
      // No thread found, so log and return
      this.logger.debug(`Got non-created event and didn't find a threadTS`, {
        action: body.action,
        prId: prId,
      });
      return;
    }

    if (body.action === "deleted") {
      // Ingore, this is probably a comment or review that was deleted
      return;
    }

    if (body.action === "submitted" && body.review) {
      if (body.review.state === "commented" && body.review.body === null) {
        // This means they left a comment on the PR, not an actual review comment
        return;
      }
      await this.postReview(
        body.pull_request.id,
        body.review,
        body.sender.login,
        threadTs,
      );
      return;
      // Comments
    }

    if (
      (body.action === "opened" || body.action === "created") &&
      body.comment &&
      body.comment.user.type === "User"
    ) {
      await this.postComment({
        prId,
        commentBody: body.comment.body,
        commentUrl: body.comment.html_url,
        login: body.sender.login,
        threadTs: threadTs,
      });
      return;
    }

    if (body.action === "closed") {
      if (body.pull_request.merged) {
        await this.postPrMerged(prId, body, threadTs);
      } else {
        await this.postPrClosed(prId, body, threadTs);
      }
    } else {
      // TODO: Improve this block

      if (body.action === "synchronize") {
        return;
      }

      if (body.action === "review_requested" && body.requested_reviewer) {
        await this.postMessage({
          message: {
            text: `Review request for ${await this.getSlackUserName(
              body.requested_reviewer.login,
            )}`,
          },
          prId,
          threadTs: threadTs,
        });
      } else if (body.action === "ready_for_review") {
        await this.postReadyForReview(prId, body, threadTs);
      } else {
        // Event we're not handling currently
        this.logger.info("Got unsupported event: ", { action: body.action });
      }
    }
  }

  private async postMessage({
    message,
    prId,
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
      const response = await this.slackClient.chat.postMessage(payload);

      if (!threadTs) {
        await this.saveThreadTs(response, prId);
      }
      return response;
    } catch (error) {
      this.logger.error("Error posting message: ", error);
      return undefined;
    }
  }

  private async getSlackUserName(githubLogin: string): Promise<string> {
    const { data: slackUserId, error } = await this.supabaseClient
      .from("username_mappings")
      .select("slack_user_id")
      .eq("github_username", githubLogin)
      .eq("organization_id", this.organizationId)
      .single();

    if (error) {
      this.logger.warn("Error getting slack user name: ", error);
      return githubLogin;
    }

    if (slackUserId) {
      return `<@${slackUserId.slack_user_id}>`;
    }

    return githubLogin;
  }

  private async saveThreadTs(message: ChatPostMessageResponse, prId: number) {
    if (!message.message?.ts) {
      this.logger.error(
        "Error saving thread ts: No message.message.ts is undefined",
      );
      return;
    }

    const { error } = await this.supabaseClient.from("pull_requests").insert({
      pr_id: prId.toString(),
      thread_ts: message.message.ts,
    });

    if (error) {
      this.logger.error("Error saving thread ts: ", error);
    }
  }

  private async postPrOpened(
    prId: number,
    body: GithubEvent,
  ): Promise<ChatPostMessageResponse | undefined> {
    try {
      return this.postMessage({
        message: {
          text: await this.getPrOpenedMessage(body),
          attachments: [await this.getPrOpenedBaseAttachment(body)],
        },
        prId,
        threadTs: undefined,
      });
    } catch (error) {
      this.logger.error("Got error posting to channel: ", error);
    }
  }

  private async postPrMerged(
    prId: number,
    body: GithubEvent,
    threadTs: string,
  ) {
    await this.postMessage({
      message: {
        text: `Pull request merged by ${await this.getSlackUserName(
          body.sender.login,
        )}`,
        attachments: [this.getMergedAttachment(false)],
      },
      prId,
      threadTs,
    });

    if (threadTs) {
      this.logger.debug(
        `Going to update message ts: ${threadTs} for channel ${this.channelId}`,
      );
      const payload: ChatUpdateArguments = {
        channel: this.channelId,
        ts: threadTs,
        token: this.slackToken,
        text: await this.getPrOpenedMessage(body),
        attachments: [
          await this.getPrOpenedBaseAttachment(body),
          this.getMergedAttachment(true),
        ],
      };

      try {
        await this.slackClient.chat.update(payload);
        this.logger.debug("Succesfully updated message with merged status");
      } catch (error) {
        this.logger.error(
          "Got error updating thread with merged status: ",
          error,
        );
      }
    }
  }

  private async postReadyForReview(
    prId: number,
    body: GithubEvent,
    threadTs: string,
  ) {
    await this.postMessage({
      message: {
        text: `Pull request marked ready for review by ${await this.getSlackUserName(
          body.sender.login,
        )}`,
      },
      prId,
      threadTs,
    });
  }

  private async postPrClosed(
    prId: number,
    body: GithubEvent,
    threadTs: string,
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
                  text: `Pull request closed by ${await this.getSlackUserName(
                    body.sender.login,
                  )}`,
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

  private async postComment({
    prId,
    commentBody,
    commentUrl,
    login,
    threadTs,
  }: {
    prId: number;
    commentBody: string;
    commentUrl: string;
    login: string;
    threadTs: string;
  }) {
    await this.postMessage({
      message: {
        text: `${await this.getSlackUserName(
          login,
        )} left <${commentUrl}|a comment>`,
        attachments: [
          {
            text: commentBody,
          },
        ],
      },
      prId,
      threadTs,
    });
  }

  private async postReview(
    prId: number,
    review: Review,
    login: string,
    threadTs: string,
  ) {
    const getReviewText = (review: Review) => {
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
        text: `${await this.getSlackUserName(login)} ${getReviewText(review)}`,
        attachments: [
          {
            text: review.body,
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

  private async getThreadTs(prId: number): Promise<string | undefined> {
    const { data, error } = await this.supabaseClient
      .from("pull_requests")
      .select("thread_ts")
      .eq("pr_id", prId.toString())
      .single();

    if (error) {
      this.logger.debug("Error getting threadTs: ", error);
    }

    this.logger.debug("Found threadTS: ", { threadTs: data?.thread_ts });

    return data?.thread_ts;
  }

  private async getPrOpenedMessage(body: GithubEvent): Promise<string> {
    return `Pull request opened by ${await this.getSlackUserName(
      body.sender.login,
    )}`;
  }

  private async getPrOpenedBaseAttachment(body: GithubEvent) {
    return {
      // color: "#106D04",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `#${body.pull_request.number} ${body.pull_request.title}`,
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
                  text: `${body.pull_request.body}`,
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
              text: `${await this.getSlackUserName(body.sender.login)}`,
            },
            {
              type: "image",
              image_url: `${process.env.NEXT_PUBLIC_BASE_URL}/plus-minus-diff-icon-alt.png`,
              alt_text: "plus-minus-icon",
            },
            {
              type: "mrkdwn",
              text: `+${body.pull_request.additions}, -${body.pull_request.deletions}`,
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
