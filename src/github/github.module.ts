import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { GithubController } from "./github.controller";
import { GithubService } from "./github.service";

@Module({
  controllers: [GithubController],
  providers: [GithubService, PrismaService],
})
export class GithubModule {}
