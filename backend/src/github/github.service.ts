import { Injectable } from "@nestjs/common";
import { ChatPostMessageResponse, WebClient } from "@slack/web-api";
import axios from "axios";
import { GithubActions, GithubEvent, PullRequest } from "types/githubApiTypes";
import { PrismaService } from "../prisma/prisma.service";

export interface TokenResponse {
  access_token: string;
  scope: string;
  token_type: string;
}

@Injectable()
export class GithubService {
  slackClient: WebClient;

  channelId = "C03GBF3FCNR";

  // ID of the PR to ID of the message
  seenPrs: Record<string, string> = {};

  constructor(private prisma: PrismaService) {
    this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
  }

  async handleEvent(body: GithubEvent) {
    if (body.pull_request && body.pull_request.id) {
      const pullRequest = body.pull_request;

      const prId = body.pull_request.id;

      // 1. Post Open PRs to before checking
      // try and find the id in the database
      // If it doesn't

      // Review comments
      if (body.action === "submitted" && body.review) {
        const record = await this.prisma.pull_requests
          .findFirst({
            where: {
              pr_id: prId.toString(),
            },
          })
          .catch((e) => {
            console.log("Error finding pr: ", e);
          });
        if (record) {
          this.slackClient.chat.postMessage({
            token: process.env.SLACK_BOT_TOKEN,
            thread_ts: record.thread_ts,
            channel: this.channelId,
            text: `${await this.getSlackUserName(
              body.sender.login,
            )} Left a comment`,
            attachments: [
              {
                author_name: body.review.user.login,
                text: body.review.body,
                color: "#fff",
              },
            ],
          });
        }
      } else if (body.action === "created" && body.comment) {
        // toodo
        console.log(JSON.stringify(body, null, 2));
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
      const record = await this.prisma.pull_requests
        .findFirst({
          where: {
            pr_id: prId.toString(),
          },
        })
        .catch((e) => {
          console.log("Error finding pr: ", e);
        });

      const text = `Pull request ${
        body.action
      } by ${await this.getSlackUserName(body.sender.login)}`;

      const attachments = [
        {
          text: `<${body.pull_request.html_url}|${body.pull_request.title}>`,
          color: "#2eb886",
        },
      ];

      if (record) {
        this.slackClient.chat.postMessage({
          token: process.env.SLACK_BOT_TOKEN,
          thread_ts: record.thread_ts,
          channel: this.channelId,
          text,
          attachments,
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
    console.log("Posting message ts: ", message.message.ts);
    console.log("PR id: ", prId);
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

  private postPrOpened(
    prId: number,
    body: GithubEvent,
    pullRequest: PullRequest,
  ) {
    this.slackClient.chat
      .postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        thread_ts: this.seenPrs[prId],
        channel: this.channelId,
        text: `Pull request opened by <${body.sender.html_url}|${body.sender.login}>`,
        attachments: [
          {
            author_name: `<${body.pull_request.html_url}|#${body.pull_request.number} ${body.pull_request.title}>`,
            text: `+${pullRequest.additions} -${pullRequest.deletions}`,
            color: "#6F42C1",
            footer: pullRequest.created_at,
          },
        ],
      })
      .then((message) => this.saveThreadTs(message, prId));
  }

  sendMessage() {
    this.slackClient.chat.postMessage({
      channel: this.channelId,
      text: "test message",
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
        this.prisma.github_integration
          .create({
            data: {
              team_id: teamId,
              access_token: response.data.access_token,
            },
          })
          .then(() => console.log("success creating gihub integration"))
          .catch((e) => console.log("Error creating integration: ", e));
      })
      .catch((error) => console.log("Error getting access token: ", error));
  }
}
