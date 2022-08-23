import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Redirect,
  Res,
  UseGuards,
} from "@nestjs/common";
import { LocalAuthGuard } from "src/auth/local-auth.guard";
import { GithubEvent } from "types/githubEventTypes";
import { GithubService } from "./github.service";
import { CreateTeamRepoBody, GithubAppService } from "./githubApp.service";

export interface GithubAuthQueryParams {
  code: string;
  state: string;
}

@Controller("/github")
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly githubAppService: GithubAppService,
  ) {}

  @Get("/auth")
  @Redirect("https://docs.nestjs.com", 301)
  async handleGithubAuth(@Query() query: GithubAuthQueryParams, @Res() res) {
    await this.githubAppService.getUserAccessToken(query.code, query.state);

    return { url: process.env.BASE_FE_URL };
  }

  @UseGuards(LocalAuthGuard)
  @Get("/repositories")
  async getRepositories(@Query("teamId") teamId: string) {
    // TODO: verify that the teamId is valid for the user
    const result = await this.githubAppService.getTeamInstaledRepos(teamId);
    return result;
  }

  @Post("/events")
  postGithubEvents(@Body() body: GithubEvent) {
    console.log("Got event");
    this.githubService.handleEvent(body);
  }

  @Post("/add-repository")
  async addRepository(@Body() body: CreateTeamRepoBody) {
    this.githubAppService.addTeamRepository(body);
  }

  @Get("/jwt")
  async getJwt() {
    return (await this.githubAppService.getJwt()).compact();
  }
}
