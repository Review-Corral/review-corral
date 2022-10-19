import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from "@nestjs/common";
import { username_mappings } from "@prisma/client";
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

  @Get("/username-mappings/:teamId")
  @UseGuards(LocalAuthGuard)
  getUsernameMappings(
    @Param("teamId") teamId: string,
  ): Promise<username_mappings[]> {
    return this.teamService.getUsernameMappings(teamId);
  }

  @Post("/username-mappings")
  @UseGuards(LocalAuthGuard)
  postUsernameMapping(
    @Request() req,
    @Body() body: username_mappings,
  ): Promise<username_mappings> {
    return this.teamService.createUsernameMapping(req.user, body);
  }

  @Put("/username-mappings")
  @UseGuards(LocalAuthGuard)
  putUsernameMapping(
    @Request() req,
    @Body() body: username_mappings,
  ): Promise<username_mappings> {
    return this.teamService.updateUsernameMapping(req.user, body);
  }

  @Delete("/username-mappings")
  @UseGuards(LocalAuthGuard)
  deleteUsernameMapping(
    @Request() req,
    @Body() body: username_mappings,
  ): Promise<username_mappings> {
    return this.teamService.deleteUsernameMapping(req.user, body);
  }
}
