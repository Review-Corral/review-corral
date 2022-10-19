import { Module } from "@nestjs/common";
import { TeamService } from "src/team/team.service";
import { PrismaService } from "../prisma/prisma.service";
import { GithubController } from "./github.controller";
import { GithubService } from "./github.service";
import { GithubAppService } from "./githubApp.service";

@Module({
  controllers: [GithubController],
  providers: [GithubService, GithubAppService, PrismaService, TeamService],
})
export class GithubModule {}
