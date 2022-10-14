import { Injectable } from "@nestjs/common";
import { github_repositories, slack_integration } from "@prisma/client";
import { WebClient } from "@slack/web-api";
import { GithubEvent } from "types/githubEventTypes";
import { PrismaService } from "../prisma/prisma.service";
import { GithubEventHandler } from "./GithubEventHandler";

export interface TokenResponse {
  access_token: string;
  scope: string;
  token_type: string;
}

@Injectable()
export class GithubService {
  slackClient: WebClient;

  constructor(private prisma: PrismaService) {
    this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
  }

  async handleEvent(body: GithubEvent) {
    console.log(body);
    if (body.pull_request && body.pull_request.id && body.repository.id) {
      const { slackIntegration, githubRepository } =
        await this.getIntegrationsForEvent(body.repository.id);

      if (slackIntegration && githubRepository) {
        new GithubEventHandler(
          this.prisma,
          this.slackClient,
          slackIntegration.channel_id,
          slackIntegration.access_token,
          githubRepository.installation_id,
        ).handleEvent(body);
      }
    } else {
      console.info("Got non PR body: ", body);
    }
  }

  private async getIntegrationsForEvent(repositoryId: number): Promise<{
    slackIntegration?: slack_integration;
    githubRepository?: github_repositories;
  }> {
    const githubRepository = await this.prisma.github_repositories.findUnique({
      where: {
        repository_id: repositoryId.toString(),
      },
    });

    if (githubRepository) {
      const slackIntegration = await this.prisma.slack_integration.findFirst({
        where: {
          team_id: githubRepository.team_id,
        },
      });

      if (slackIntegration) {
        return {
          githubRepository,
          slackIntegration,
        };
      } else {
        console.info(
          `No slack integration found for team id of ${githubRepository.team_id}`,
        );
      }
    } else {
      console.info(
        `No github repository found for repository id of ${repositoryId}`,
      );
    }

    return { slackIntegration: undefined, githubRepository: undefined };
  }
}
