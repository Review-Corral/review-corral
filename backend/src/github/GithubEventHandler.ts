import {
  ChatPostMessageArguments,
  ChatPostMessageResponse,
  WebClient,
} from "@slack/web-api";
import axios from "axios";
import { PrismaService } from "src/prisma/prisma.service";
import {
  GithubEvent,
  PullRequest,
  PullRequestComment,
  Review,
} from "types/githubEventTypes";
import { getInstallationAccessToken } from "./utils";

export class GithubEventHandler {
  constructor(
    private readonly prisma: PrismaService,
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
      await this.handleNewPr(prId, body);
    } else {
      await this.handleOtherEvent(body, prId);
    }
  }

  private async handleNewPr(prId: number, body: GithubEvent) {
    const threadTs = (await this.postPrOpened(prId, body, body.pull_request))
      .ts;

    if (threadTs) {
      // Get all comments and post
      console.info("Installation ID: ", this.installationId);
      const accessToken = await getInstallationAccessToken(
        this.installationId.toString(),
      );
      axios
        .get<PullRequestComment[]>(body.pull_request.comments_url, {
          headers: {
            Authorization: `bearer ${accessToken.token}`,
          },
        })
        .then((response) => {
          response.data.forEach((comment) => {
            if (comment.user.type === "User") {
              this.postComment(
                prId,
                comment.body,
                comment.user.login,
                threadTs,
              );
            }
          });
        })
        .catch((error) => {
          console.error("Error getting comments: ", error);
        });

      // Get all requested Reviews and post
      body.pull_request.requested_reviewers.map(async (requested_reviewer) => {
        await this.postMessage({
          message: {
            text: `Review request for ${await this.getSlackUserName(
              requested_reviewer.login,
            )}`,
          },
          prId,
          threadTs: threadTs,
        });
      });
    } else {
      console.error(
        "Error posting new thread message to Slack: Didn't get message response back to thread messages",
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
      this.postReview(
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
      this.postComment(prId, body.comment.body, body.sender.login, threadTs);
      return;
    }

    if (body.action === "closed") {
      if (body.pull_request.merged) {
        this.postPrMerged(prId, body, threadTs);
      } else {
        this.postPrClosed(prId, body, threadTs);
      }
    } else {
      // TODO: Improve this block

      if (body.action === "synchronize") {
        return;
      }

      let text: string;

      if (body.action === "review_requested" && body.requested_reviewer) {
        text = `Review request for ${await this.getSlackUserName(
          body.requested_reviewer.login,
        )}`;
      } else if (body.action === "ready_for_review") {
        this.postReadyForReview(prId, body, threadTs);
      } else {
        text = `Pull request ${body.action} by ${await this.getSlackUserName(
          body.sender.login,
        )}`;
      }

      this.postMessage({
        message: {
          text,
        },
        prId,
        threadTs: threadTs,
      });
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
      return this.slackClient.chat.postMessage(payload).then((response) => {
        this.saveThreadTs(response, prId);
        return response;
      });
    } catch (error) {
      console.log("Error posting message: ", error);
      return undefined;
    }
  }

  private async getSlackUserName(githubLogin: string): Promise<string> {
    const foundUsername = await this.prisma.username_mappings.findUnique({
      where: {
        github_username: githubLogin,
      },
    });

    if (foundUsername) {
      return `<@${foundUsername.slack_username}>`;
    }

    return githubLogin;
  }

  private saveThreadTs(message: ChatPostMessageResponse, prId: number) {
    this.prisma.pull_requests
      .create({
        data: {
          thread_ts: message.message.ts,
          pr_id: prId.toString(),
        },
      })
      .then(() => console.log("success"))
      .catch((e) => console.log("error: ", e));
  }

  private async postPrOpened(
    prId: number,
    body: GithubEvent,
    pullRequest: PullRequest,
  ): Promise<ChatPostMessageResponse> {
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

  private async postPrMerged(
    prId: number,
    body: GithubEvent,
    threadTs: string,
  ) {
    this.postMessage({
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
                  text: `Pull Request merged\n ${body.pull_request.merged_at}`,
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
      try {
        this.slackClient.chat.update({
          channel: this.channelId,
          ts: threadTs,
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
        });
      } catch (error) {
        console.error("Got error updating thread: ", error);
      }
    }
  }

  private async postReadyForReview(
    prId: number,
    body: GithubEvent,
    threadTs: string,
  ) {
    this.postMessage({
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
    this.postMessage({
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

  private async postComment(
    prId: number,
    comment: string,
    login: string,
    threadTs: string,
  ) {
    this.postMessage({
      message: {
        text: `${await this.getSlackUserName(login)} left a comment`,
        attachments: [
          {
            text: comment,
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

    this.postMessage({
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
    return (
      await this.prisma.pull_requests.findFirst({
        where: {
          pr_id: prId.toString(),
        },
      })
    )?.thread_ts;
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
              action_id: "button-action",
            },
          ],
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Additions*\n +${body.pull_request.additions}`,
            },
            {
              type: "mrkdwn",
              text: `*Additions*\n +${body.pull_request.deletions}`,
            },

            {
              type: "mrkdwn",
              text: `*Target branch*\n ${body.pull_request.base.ref}`,
            },
            {
              type: "mrkdwn",
              text: `*Source Branch*\n ${body.pull_request.head.ref}`,
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
          ],
        },
      ],
    };
  }
}
