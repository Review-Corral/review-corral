import { Controller, Get, Query, Redirect, UseGuards } from "@nestjs/common";
import { slack_integration } from "@prisma/client";
import { LocalAuthGuard } from "src/auth/local-auth.guard";
import { SlackAuthQueryParams, SlackService } from "./slack.service";

@Controller("/slack")
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @Get()
  @Redirect()
  getSlackAuthEvent(@Query() query: SlackAuthQueryParams) {
    console.log("got slack auth event");
    this.slackService.subscribeTeam(query);

    return {
      url: process.env.BASE_FE_URL,
    };
  }

  @Get("/integrations")
  @UseGuards(LocalAuthGuard)
  getSlackIntegration(
    @Query("teamId") teamId: string,
  ): Promise<slack_integration[]> {
    return this.slackService.getIntegrations(teamId);
  }
}
