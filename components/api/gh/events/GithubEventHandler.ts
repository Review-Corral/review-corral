import {
  ChatPostMessageArguments,
  ChatPostMessageResponse,
  WebClient,
} from "@slack/web-api";
import { SupabaseClient } from "@supabase/supabase-js";
import axios from "axios";
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
  ) {}

  async handleEvent(body: GithubEvent) {
    console.log("Got event with action: ", body.action);
    const prId = body.pull_request.id;

    // New PR, should be the only two threads that create a new thread
    if (
      ((body.action === "opened" && body.pull_request?.draft === false) ||
        body.action === "ready_for_review") &&
      body.pull_request
    ) {
      console.log("Handling new PR");
      await this.handleNewPr(prId, body);
    } else {
      console.log("Handling different event");
      await this.handleOtherEvent(body, prId);
    }
  }

  private async handleNewPr(prId: number, body: GithubEvent) {
    const threadTs = (await this.postPrOpened(prId, body))?.ts;

    if (threadTs) {
      // Get all comments and post
      console.info("Installation ID: ", this.installationId);
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
        console.error("Error getting comments: ", error);
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
      console.error(
        "Error posting new thread for PR opened message to Slack: ",
        "Didn't get message response back to thread messages",
        "PR ID: ",
        prId,
      );
    }
  }

  private async handleOtherEvent(body: GithubEvent, prId: number) {
    const threadTs = await this.getThreadTs(prId);

    if (!threadTs) {
      // No thread found, so log and return
      console.error(
        `Got non-created event (${body.action}) for PR id of ${prId}`,
      );
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
        console.info("Got unspuported event: ", body.action);
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
      console.log("Error posting message: ", error);
      return undefined;
    }
  }

  private async getSlackUserName(githubLogin: string): Promise<string> {
    const { data: slackUserId, error } = await this.supabaseClient
      .from("username_mappings")
      .select("slack_user_id")
      .eq("github_username", githubLogin)
      .single();

    if (error) {
      console.error("Error getting slack user name: ", error);
      return githubLogin;
    }

    if (slackUserId) {
      return `<@${slackUserId.slack_user_id}>`;
    }

    return githubLogin;
  }

  private async saveThreadTs(message: ChatPostMessageResponse, prId: number) {
    if (!message.message?.ts) {
      console.error(
        "Error saving thread ts: No message.message.ts is undefined",
      );
      return;
    }

    const { error } = await this.supabaseClient.from("pull_requests").insert({
      pr_id: prId.toString(),
      thread_ts: message.message.ts,
    });

    if (error) {
      console.error("Error saving thread ts: ", error);
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
      console.error("Got error posting to channel: ", error);
    }
  }

  private getDateFromTimestamp(timestamp: string): Date {
    return new Date(Date.parse(timestamp));
  }

  private async getLocalTimeString(date: Date): Promise<string> {
    return `${date.toLocaleString("en-US", {
      timeZone: "America/New_York",
    })} Eastern`;
  }

  private async postPrMerged(
    prId: number,
    body: GithubEvent,
    threadTs: string,
  ) {
    const date = this.getDateFromTimestamp(body.pull_request!.merged_at!);
    await this.postMessage({
      message: {
        text: `Pull request merged by ${await this.getSlackUserName(
          body.sender.login,
        )}`,
        attachments: [
          {
            color: "#8839FB",
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  // TODO: not type safe
                  text: `Merged at:\n <!date^${date.valueOf()}|${await this.getLocalTimeString(
                    date,
                  )}>`,
                },
              },
            ],
          },
        ],
      },
      prId,
      threadTs,
    });

    if (threadTs) {
      console.info(
        `Going to update message ts: ${threadTs} for channel ${this.channelId}`,
      );
      const payload = {
        channel: this.channelId,
        ts: threadTs,
        token: this.slackToken,
        text: await this.getPrOpenedMessage(body),
        attachments: [
          await this.getPrOpenedBaseAttachment(body),
          {
            color: "#8839FB",
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "Pull Request merged",
                },
              },
            ],
          },
        ],
      };

      try {
        await this.slackClient.chat.update(payload);
        console.log("Succesfully updated message with merged status");
      } catch (error) {
        console.error("Got error updating thread with merged status: ", error);
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
        text: `Pull request closed by ${await this.getSlackUserName(
          body.sender.login,
        )}`,
        attachments: [
          {
            author_name: `<${body.pull_request.html_url}|#${body.pull_request.number} ${body.pull_request.title}>`,
            color: "#FB0909",
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
      console.info("Error getting threadTs: ", error);
    }

    console.log("Found threadTS: ", data?.thread_ts);

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
              image_url:
                "https://reviewcorral.ngrok.io/plus-minus-diff-icon-alt.png",
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
}
