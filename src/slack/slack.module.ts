import { Module } from "@nestjs/common";
import { SlackController } from "./slack.controller";

@Module({
  controllers: [SlackController],
})
export class SlackModule {}
