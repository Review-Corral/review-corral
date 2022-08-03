import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { GithubModule } from "./github/github.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SlackModule } from "./slack/slack.module";
import { TeamModule } from "./team/team.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    GithubModule,
    PrismaModule,
    SlackModule,
    TeamModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
