import { Body, Controller, Get, Query } from "@nestjs/common";
import { SlackAuthQueryParams, SlackService } from "./slack.service";

@Controller("/slack")
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @Get()
  getSlackAuthEvent(@Body() body: any, @Query() query: SlackAuthQueryParams) {
    console.log(body);
    console.log("query: ", query);

    this.slackService.subscribeTeam(query);
  }
}
