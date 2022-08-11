import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { GithubController } from "./github.controller";
import { GithubService } from "./github.service";
import { GithubAppService } from "./githubApp.service";

@Module({
  controllers: [GithubController],
  providers: [GithubService, GithubAppService, PrismaService],
})
export class GithubModule {}
