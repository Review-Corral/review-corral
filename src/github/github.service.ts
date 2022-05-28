import { Injectable } from "@nestjs/common";
import { ChatPostMessageResponse, WebClient } from "@slack/web-api";
import { PrismaService } from "src/prisma/prisma.service";
import { GithubEvent, PullRequest } from "types/githubApiTypes";
// delete-this comment

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

      console.log(body.pull_request);

      const prId = body.pull_request.id;

      // 1. Post Open PRs to before checking
      // try and find the id in the database
      // If it doesn't

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

        if (record) {
          const thread_ts = record.thread_ts;
          this.slackClient.chat.postMessage({
            token: process.env.SLACK_BOT_TOKEN,
            thread_ts: thread_ts,
            channel: this.channelId,
            text: `${body.sender.login} ${body.action} <${body.pull_request.html_url}|${body.pull_request.title}>`,
            attachments: [
              {
                author_name: "Bobby Tables",
                color: "#2eb886",
              },
            ],
          });
        } else {
          this.slackClient.chat
            .postMessage({
              token: process.env.SLACK_BOT_TOKEN,
              channel: this.channelId,
              text: `${body.sender.login} ${body.action} <${body.pull_request.html_url}|${body.pull_request.title}>`,
            })
            .then((message) => {
              console.log(`Message thread_ts: ${message.message?.thread_ts}`);
              if (message.message?.ts) {
                this.saveThreadTs(message, prId);
                console.log("Added pr id to seenPrs");
                console.log(this.seenPrs);
              }
            });
        }
      }
    }
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
}
