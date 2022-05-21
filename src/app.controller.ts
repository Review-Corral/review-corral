import { Body, Controller, Get, Post } from "@nestjs/common";
import {
  GithubAction,
  GithubActions,
  GithubEvent,
  PullRequest,
} from "types/githubApiTypes";
import { AppService } from "./app.service";

// We just need to map the pull requests with the slack IDs so we can thread the messages
const pullRequests: Record<PullRequest["id"], PullRequest> = {};

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post("/events")
  postGithubEvents(@Body() body: GithubEvent) {
    console.log(`Got action of ${body.action}`);

    if (GithubActions.includes(body.action)) {
      const action: GithubAction = body.action;

      console.log(`Got action of ${body.action}`);

      if (action === "opened") {
        pullRequests[body.pull_request.id] = body.pull_request;
      }
    }

    console.log(JSON.stringify(body, null, 2));
  }
}
