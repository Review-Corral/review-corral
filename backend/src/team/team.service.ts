import { Injectable } from "@nestjs/common";
import { team, username_mappings } from "@prisma/client";
import { AuthorizationError } from "@slack/oauth";
import { User } from "@supabase/supabase-js";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async getTeams(user: User): Promise<team[]> {
    const usersAndTeams = await this.prisma.users_and_teams.findMany({
      where: {
        user: user.id,
      },
    });

    return await Promise.all(
      usersAndTeams.map(
        async (userAndTeam) =>
          await this.prisma.team.findUnique({
            where: {
              id: userAndTeam.team,
            },
          }),
      ),
    );
  }

  async createTeam({
    user,
    name,
  }: {
    user: User;
    name: string;
  }): Promise<team> {
    const team = await this.prisma.team.create({
      data: {
        name,
      },
    });

    await this.prisma.users_and_teams.create({
      data: {
        user: user.id,
        team: team.id,
      },
    });

    return team;
  }

  async getUsernameMappings(teamId: string): Promise<username_mappings[]> {
    return this.prisma.username_mappings.findMany({
      where: { team_id: teamId },
    });
  }

  async createUsernameMapping(
    user: User,
    usernameMapping: username_mappings,
  ): Promise<username_mappings> {
    this._checkUserHasTeamPermission(user, usernameMapping.team_id);

    return this.prisma.username_mappings.create({
      data: usernameMapping,
    });
  }

  async updateUsernameMapping(
    user: User,
    usernameMapping: username_mappings,
  ): Promise<username_mappings> {
    this._checkUserHasTeamPermission(user, usernameMapping.team_id);

    return this.prisma.username_mappings.update({
      where: {
        id: usernameMapping.id,
      },
      data: usernameMapping,
    });
  }

  async deleteUsernameMapping(
    user: User,
    usernameMapping: username_mappings,
  ): Promise<username_mappings> {
    this._checkUserHasTeamPermission(user, usernameMapping.team_id);

    return this.prisma.username_mappings.delete({
      where: { id: usernameMapping.id },
    });
  }

  async _checkUserHasTeamPermission(user: User, teamId: string): Promise<void> {
    const team = await this.prisma.users_and_teams.findFirst({
      where: { team: teamId, user: user.id },
    });

    if (!team) {
      throw new AuthorizationError(
        "User does not have permission for this username mapping",
      );
    }
  }
}
