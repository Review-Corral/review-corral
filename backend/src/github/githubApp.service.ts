import { Injectable, NotFoundException } from "@nestjs/common";
import axios from "axios";
import { PrismaService } from "src/prisma/prisma.service";
import { Repositories } from "types/githubAppTypes";
import { Team } from "types/slackAuthTypes";

@Injectable()
export class GithubAppService {
  constructor(private prisma: PrismaService) {}

  async getRepositories(teamId: Team["id"]): Promise<Repositories> {
    console.log("Got team id:", teamId);
    const github_integration = await this.prisma.github_integration.findUnique({
      where: {
        team_id: teamId,
      },
    });

    console.log("github_integration:", github_integration);

    if (!github_integration || !github_integration.access_token) {
      throw new NotFoundException("No github integration found");
    }

    const response = await axios.get<Repositories>(
      "https://api.github.com/user/installations",
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `token ${github_integration.access_token}`,
        },
      },
    );

    console.log(response.data);

    return response.data;
  }
}
