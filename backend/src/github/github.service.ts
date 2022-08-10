import { Injectable } from "@nestjs/common";
import { pull_requests } from "@prisma/client";
import { ChatPostMessageResponse, WebClient } from "@slack/web-api";
import axios from "axios";
import {
  GithubActions,
  GithubEvent,
  PullRequest,
  Review,
} from "types/githubApiTypes";
import { PrismaService } from "../prisma/prisma.service";

export interface TokenResponse {
  access_token: string;
  scope: string;
  token_type: string;
}

@Injectable()
export class GithubService {
  slackClient: WebClient;

  // TODO: need to get this from the prisma client
  channelId = "C03GBF3FCNR";

  constructor(private prisma: PrismaService) {
    this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
  }

  async handleEvent(body: GithubEvent) {
    console.log(body);
    if (body.pull_request && body.pull_request.id) {
      const pullRequest = body.pull_request;
      const prId = body.pull_request.id;

      // Review comments
      if (body.action === "submitted" && body.review) {
        this.postReview(body.pull_request.id, body.review, body.sender.login);

        // Comments
      } else if (body.action === "created" && body.comment) {
        this.postComment(
          body.pull_request.id,
          body.comment.body,
          body.sender.login,
        );
      } else if (GithubActions.includes(body.action) && body.pull_request) {
        await this.handlePullRequestEvent(body, prId, pullRequest);
      }
    } else {
      console.log("Got non PR body: ");
      console.log(body);
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
      const record = await this.findPr(prId);

      let text: string;
      if (body.action === "review_requested" && body.requested_reviewer) {
        console.log(body);
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
      } else {
        text = `Pull request ${body.action} by ${await this.getSlackUserName(
          body.sender.login,
        )}`;
      }

      if (record) {
        this.slackClient.chat.postMessage({
          token: process.env.SLACK_BOT_TOKEN,
          thread_ts: record.thread_ts,
          channel: this.channelId,
          text,
        });
      } else {
        this.slackClient.chat
          .postMessage({
            token: process.env.SLACK_BOT_TOKEN,
            channel: this.channelId,
            text,
          })
          .then((message) => {
            if (message.message?.ts) {
              this.saveThreadTs(message, prId);
            }
          });
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
    this.slackClient.chat
      .postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: this.channelId,
        text: `Pull request opened by ${await this.getSlackUserName(
          body.sender.login,
        )}`,
        attachments: [
          {
            author_name: `<${body.pull_request.html_url}|#${body.pull_request.number} ${body.pull_request.title}>`,
            text: `+${pullRequest.additions} -${pullRequest.deletions}`,
            color: "#6F42C1",
          },
        ],
      })
      .then((message) => this.saveThreadTs(message, prId));
  }

  private async postPrMerged(prId: number, body: GithubEvent) {
    this.slackClient.chat
      .postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: this.channelId,
        text: `Pull request merged by ${await this.getSlackUserName(
          body.sender.login,
        )}`,
        attachments: [
          {
            author_name: `<${body.pull_request.html_url}|#${body.pull_request.number} ${body.pull_request.title}>`,
            color: "#8839FB",
          },
        ],
      })
      .then((message) => this.saveThreadTs(message, prId));
  }

  private async postPrClosed(prId: number, body: GithubEvent) {
    this.slackClient.chat
      .postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: this.channelId,
        text: `Pull request closed by ${await this.getSlackUserName(
          body.sender.login,
        )}`,
        attachments: [
          {
            author_name: `<${body.pull_request.html_url}|#${body.pull_request.number} ${body.pull_request.title}>`,
            color: "#FB0909",
          },
        ],
      })
      .then((message) => this.saveThreadTs(message, prId));
  }

  private async postComment(prId: number, comment: string, login: string) {
    const thread = await this.findPr(prId);

    this.slackClient.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      thread_ts: thread.thread_ts,
      channel: this.channelId,
      text: `${await this.getSlackUserName(login)} left a comment`,
      attachments: [
        {
          text: comment,
        },
      ],
    });
  }

  private async postReview(prId: number, review: Review, login: string) {
    const thread = await this.findPr(prId);

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

    this.slackClient.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      thread_ts: thread.thread_ts,
      channel: this.channelId,
      text: `${await this.getSlackUserName(login)} ${getReviewText(review)}`,
      attachments: [
        {
          text: review.body,
          color: "#fff",
        },
      ],
    });
  }

  async getAccessToken(code: string, teamId: string) {
    const params = new URLSearchParams();
    params.append("client_id", process.env.GITHUB_CLIENT_ID);
    params.append("client_secret", process.env.GITHUB_CLIENT_SECRET);
    params.append("code", code);

    const url = new URL("https://github.com/login/oauth/access_token");
    url.search = params.toString();

    axios
      .post(url.toString(), undefined, {
        headers: { accept: "application/json" },
      })
      .then((response) => {
        console.log("Got access token: ", response.data.access_token);

        const foundIntegration = this.prisma.github_integration.findFirst({
          where: { id: teamId },
        });

        if (foundIntegration) {
          this.prisma.github_integration.update({
            where: { id: teamId },
            data: {
              access_token: response.data.access_token,
            },
          });
        } else {
          this.prisma.github_integration
            .create({
              data: {
                team_id: teamId,
                access_token: response.data.access_token,
              },
            })
            .then(() => console.log("success creating gihub integration"))
            .catch((error) => {
              console.log("Error creating integration: ", error);
              throw error;
            });
        }
      })
      .catch((error) => {
        console.log("Error getting access token: ", error);
        throw error;
      });
  }
}
