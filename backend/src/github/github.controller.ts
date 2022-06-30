import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { GithubEvent, PullRequest } from "types/githubApiTypes";
import { GithubService } from "./github.service";

// We just need to map the pull requests with the slack IDs so we can thread the messages
const pullRequests: Record<PullRequest["id"], PullRequest> = {};

export interface GithubAuthQueryParams {
  code: string;
  state: string;
}

@Controller("/github")
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get("/auth")
  async handleGithubAuth(@Query() query: GithubAuthQueryParams) {
    this.githubService.getAccessToken(query.code, query.state);

    return {
      url: process.env.BASE_FE_URL,
    };
  }

  @Post("/events")
  postGithubEvents(@Body() body: GithubEvent) {
    this.githubService.handleEvent(body);
  }

  @Post("/send-message")
  sendMessage() {
    this.githubService.sendMessage();
  }
}
