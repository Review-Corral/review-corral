import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SlackController } from "./slack.controller";
import { SlackService } from "./slack.service";

@Module({
  providers: [SlackService, PrismaService],
  controllers: [SlackController],
})
export class SlackModule {}
