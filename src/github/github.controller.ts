import { Body, Controller, Post } from "@nestjs/common";
import { GithubEvent, PullRequest } from "types/githubApiTypes";
import { GithubService } from "./github.service";

// We just need to map the pull requests with the slack IDs so we can thread the messages
const pullRequests: Record<PullRequest["id"], PullRequest> = {};

@Controller("/github")
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Post("/events")
  postGithubEvents(@Body() body: GithubEvent) {
    this.githubService.handleEvent(body);
  }

  @Post("/send-message")
  sendMessage() {
    this.githubService.sendMessage();
  }
}

// test
