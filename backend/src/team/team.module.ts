import { Module } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { TeamController } from "./team.controller";
import { TeamService } from "./team.service";

@Module({
  providers: [TeamService, PrismaService],
  controllers: [TeamController],
})
export class TeamModule {}
