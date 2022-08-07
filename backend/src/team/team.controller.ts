import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { LocalAuthGuard } from "src/auth/local-auth.guard";
import { TeamService } from "./team.service";

@Controller("/teams")
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @UseGuards(LocalAuthGuard)
  @Get()
  getTeam(@Request() req) {
    return this.teamService.getTeams(req.user);
  }

  @UseGuards(LocalAuthGuard)
  @Post()
  createTeam(@Request() req, @Body() body: { name: string }) {
    return this.teamService.createTeam({ user: req.user, name: body.name });
  }
}
