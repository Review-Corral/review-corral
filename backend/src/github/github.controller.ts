import {
  Body,
  Controller,
  Delete,
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
import {
  CreateTeamRepoBody,
  GithubAppService,
  InstalledRepositoryWithInstallationId,
} from "./githubApp.service";
import { getJwt } from "./utils";

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
    console.log("Hit auth endpoint");
    await this.githubAppService.getUserAccessToken(query.code, query.state);

    return { url: process.env.BASE_FE_URL };
  }

  @Post("/events")
  postGithubEvents(@Body() body: GithubEvent) {
    console.log("Got event");

    try {
      this.githubService.handleEvent(body);
    } catch (error) {
      console.log("Error handling event: ", error);
    }
  }

  // For getting repos that the Github App is installed on
  @UseGuards(LocalAuthGuard)
  @Get("/installed-repositories")
  async getRepositories(
    @Query("teamId") teamId: string,
  ): Promise<InstalledRepositoryWithInstallationId[]> {
    // TODO: verify that the teamId is valid for the user
    return await this.githubAppService.getTeamInstaledRepos(teamId);
  }

  // For getting repos that the user is sycning with
  @UseGuards(LocalAuthGuard)
  @Get("/synced-repositories")
  async getSyncedRepositories(@Query("teamId") teamId: string) {
    // TODO: verify that the teamId is valid for the user
    return await this.githubAppService.getTeamSyncedRepos(teamId);
  }

  @Post("/synced-repositories")
  async addRepository(@Body() body: CreateTeamRepoBody) {
    this.githubAppService.addTeamRepository(body);
  }

  @Delete("/synced-repositories")
  async deleteRepository(
    @Body() body: { repoId: CreateTeamRepoBody["repositoryId"] },
  ) {
    this.githubAppService.deleteSyncedTeamRepo(body.repoId.toString());
  }

  @Get("/jwt")
  async getJwt() {
    return (await getJwt()).compact();
  }
}
