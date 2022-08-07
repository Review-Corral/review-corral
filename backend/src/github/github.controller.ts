import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Redirect,
  Res,
} from "@nestjs/common";
import { GithubEvent } from "types/githubApiTypes";
import { GithubService } from "./github.service";

export interface GithubAuthQueryParams {
  code: string;
  state: string;
}

@Controller("/github")
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get("/auth")
  @Redirect("https://docs.nestjs.com", 301)
  async handleGithubAuth(@Query() query: GithubAuthQueryParams, @Res() res) {
    this.githubService.getAccessToken(query.code, query.state);

    return { url: process.env.BASE_FE_URL };
  }

  @Post("/events")
  postGithubEvents(@Body() body: GithubEvent) {
    console.log("Got event!");
    this.githubService.handleEvent(body);
  }

  @Post("/send-message")
  sendMessage() {
    this.githubService.sendMessage();
  }
}
