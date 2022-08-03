import { Controller, Get, Redirect } from "@nestjs/common";
import { TeamService } from "./team.service";

@Controller("/team")
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()  
  @Redirect()
  getTeam() {
    // this.slackService.subscribeTeam(query);
    // return {
    //   url: process.env.BASE_FE_URL,
    // };
  }
}
