import { pull_requests } from "@prisma/client";
import {
  ChatPostMessageArguments,
  ChatPostMessageResponse,
  WebClient,
} from "@slack/web-api";
import { PrismaService } from "src/prisma/prisma.service";
import {
  GithubActions,
  GithubEvent,
  PullRequest,
  Review,
} from "types/githubEventTypes";

export class GithubEventHandler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slackClient: WebClient,
    private readonly channelId: string,
    private readonly slackToken: string,
  ) {}

  async handleEvent(body: GithubEvent) {
    console.log("Got event with action: ", body.action);
    const prId = body.pull_request.id;

    // Review comments
    if (body.action === "submitted" && body.review) {
      this.postReview(
        body.pull_request.id,
        body.review,
        body.sender.login,
        body,
      );

      // Comments
    } else if (body.action === "created" && body.comment) {
      this.postComment(prId, body.comment.body, body.sender.login, body);
    } else if (GithubActions.includes(body.action) && body.pull_request) {
      await this.handlePullRequestEvent(body, prId, body.pull_request);
    }
  }

  private async handlePullRequestEvent(
    body: GithubEvent,
    prId: number,
    pullRequest: PullRequest,
  ) {
    if (body.action === "opened") {
      this.postPrOpened(prId, body, pullRequest);
    } else {
      let text: string;
      if (body.action === "review_requested" && body.requested_reviewer) {
        text = `Review request for ${await this.getSlackUserName(
          body.requested_reviewer.login,
        )}`;
      } else if (body.action === "closed") {
        if (body.pull_request.merged) {
          this.postPrMerged(prId, body);
        } else {
          this.postPrClosed(prId, body);
        }
        return;
      } else if (body.action === "ready_for_review") {
        this.postReadyForReview(prId, body);
      } else {
        text = `Pull request ${body.action} by ${await this.getSlackUserName(
          body.sender.login,
        )}`;
      }

      this.postMessage(
        {
          text,
        },
        prId,
        body,
      );
    }
  }

  private getOpenedPrAttachment(pullRequest: PullRequest, repoName: string) {
    return {
      author_name: `<${pullRequest.html_url}|#${pullRequest.number} ${pullRequest.title}>`,
      text: `+${pullRequest.additions} -${pullRequest.deletions}`,
      title: repoName,
      color: "#106D04",
    };
  }

  private async postMessage(
    message: Omit<ChatPostMessageArguments, "token" | "channel">,
    prId: number,
    body: GithubEvent,
  ) {
    const foundPr = await this.findPr(prId);
    const threadTs = foundPr?.thread_ts;

    const { pull_request: pullRequest, repository } = body;

    try {
      this.slackClient.chat
        .postMessage({
          ...message,
          ...(threadTs && {
            thread_ts: threadTs,
          }),
          // If there is no thread
          ...(!threadTs &&
            !message.attachments && {
              attachments: [
                // this.getOpenedPrAttachment(pullRequest, repository.name),
                ...((message.attachments as Array<unknown>) ?? []),
              ],
            }),
          channel: this.channelId,
          token: this.slackToken,
        })
        .then((response) => this.saveThreadTs(response, prId));
    } catch (error) {
      console.log("Error posting message: ", error);
    }

    // If there's a message ID and we're merging the PR, update the original
    // message to say it's been merged
    if (threadTs && body.pull_request.merged) {
      try {
        this.slackClient.chat
          .update({
            ts: threadTs, // message id is actually the timestamp of the message
            channel: this.channelId,
            token: this.slackToken,
            attachments: [
              this.getOpenedPrAttachment(pullRequest, repository.name),
              {
                author_name: `Pull request merged`,
                text: `Timestamp: ${new Date().toISOString()}`,
                color: "#8839FB",
              },
            ],
          })
          .then((response) => console.log("Updated message: ", response));
      } catch (error) {
        console.log("Error updating message: ", error);
      }
    }
  }

  private async findPr(prId: number): Promise<pull_requests | null> {
    return await this.prisma.pull_requests
      .findFirst({
        where: {
          pr_id: prId.toString(),
        },
      })
      .catch((e) => {
        console.log("Error finding pr: ", e);
        return null;
      });
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
  ) {
    this.postMessage(
      {
        text: `Pull request opened by ${await this.getSlackUserName(
          body.sender.login,
        )}`,
        attachments: [
          {
            author_name: `<${body.pull_request.html_url}|#${body.pull_request.number} ${body.pull_request.title}>`,
            text: `+${pullRequest.additions} -${pullRequest.deletions}`,
            title: body.repository.name,
            color: "#106D04",
          },
        ],
      },
      prId,
      body,
    );
  }

  private async postPrMerged(prId: number, body: GithubEvent) {
    this.postMessage(
      {
        text: `Pull request merged by ${await this.getSlackUserName(
          body.sender.login,
        )}`,
        attachments: [
          {
            author_name: `<${body.pull_request.html_url}|#${body.pull_request.number} ${body.pull_request.title}>`,
            color: "#8839FB",
          },
        ],
      },
      prId,
      body,
    );
  }

  private async postReadyForReview(prId: number, body: GithubEvent) {
    this.postMessage(
      {
        text: `Pull request marked ready for review by ${await this.getSlackUserName(
          body.sender.login,
        )}`,
      },
      prId,
      body,
    );
  }

  private async postPrClosed(prId: number, body: GithubEvent) {
    this.postMessage(
      {
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
      body,
    );
  }

  private async postComment(
    prId: number,
    comment: string,
    login: string,
    body: GithubEvent,
  ) {
    this.postMessage(
      {
        text: `${await this.getSlackUserName(login)} left a comment`,
        attachments: [
          {
            text: comment,
          },
        ],
      },
      prId,
      body,
    );
  }

  private async postReview(
    prId: number,
    review: Review,
    login: string,
    body: GithubEvent,
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

    this.postMessage(
      {
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
      body,
    );
  }
}
