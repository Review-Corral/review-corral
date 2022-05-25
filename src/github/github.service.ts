import { Injectable } from "@nestjs/common";
import { WebClient } from "@slack/web-api";
// delete-this comment

@Injectable()
export class GithubService {
  slackClient: WebClient;
  constructor() {
    console.log("Instantiating");
    console.log("token: ", process.env.SLACK_BOT_TOKEN);
    this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
  }

  getHello(): string {
    return "Hello c!";
  }

  sendMessage() {
    this.slackClient.chat.postMessage({
      channel: "C03GBF3FCNR",
      text: "lol",
    });
  }
}
