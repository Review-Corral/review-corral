import { Controller, Get, Query, Redirect } from "@nestjs/common";
import { SlackAuthQueryParams, SlackService } from "./slack.service";

@Controller("/slack")
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @Get()
  @Redirect()
  getSlackAuthEvent(@Query() query: SlackAuthQueryParams) {
    this.slackService.subscribeTeam(query);

    return {
      url: process.env.BASE_FE_URL,
    };
  }
}
