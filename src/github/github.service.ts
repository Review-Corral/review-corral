import { Injectable } from "@nestjs/common";
import { WebClient } from "@slack/web-api";
import { GithubEvent } from "types/githubApiTypes";
// delete-this comment

@Injectable()
export class GithubService {
  slackClient: WebClient;

  // ID of the PR to ID of the message
  seenPrs: Record<string, string> = {};

  constructor() {
    this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
  }

  handleEvent(body: GithubEvent) {
    if (body.pull_request && body.pull_request.id) {
      const prId = body.pull_request.id;
      if (prId in this.seenPrs) {
        this.slackClient.chat.postMessage({
          token: process.env.SLACK_BOT_TOKEN,
          thread_ts: this.seenPrs[prId],
          channel: "C03GBF3FCNR",
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
            channel: "C03GBF3FCNR",
            text: `${body.sender.login} ${body.action} <${body.pull_request.html_url}|${body.pull_request.title}>`,
          })
          .then((message) => {
            console.log(`Message thread_ts: ${message.message?.thread_ts}`);
            if (message.message?.ts) {
              this.seenPrs[prId] = message.message.ts;
              console.log("Added pr id to seenPrs");
              console.log(this.seenPrs);
            }
          });
      }
    }
  }

  sendMessage() {
    this.slackClient.chat.postMessage({
      channel: "C03GBF3FCNR",
      text: "lol",
    });
  }
}
