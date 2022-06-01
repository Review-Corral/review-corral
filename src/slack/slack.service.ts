import { Injectable } from "@nestjs/common";
import axios from "axios";
import { SlackAuthEvent } from "types/slackAuthTypes";
import { PrismaService } from "../prisma/prisma.service";

export interface SlackAuthQueryParams {
  code: string;
  state?: string;
}
// delete-this comment

@Injectable()
export class SlackService {
  constructor(private prisma: PrismaService) {}

  async subscribeTeam(queryParams: SlackAuthQueryParams) {
    axios
      .postForm<
        {
          client_id: string;
          code: string;
          client_secret: string;
        },
        { data: SlackAuthEvent }
      >("https://slack.com/api/oauth.v2.access", {
        client_id: process.env.SLACK_BOT_ID,
        code: queryParams.code,
        client_secret: process.env.SLACK_CLIENT_SECRET,
      })
      .then(({ data }) => {
        console.log(data);
        this.prisma.slack_integration
          .create({
            data: {
              access_token: data.access_token,
              channel_id: data.incoming_webhook.channel_id,
              team: "7b6a702e-b3ab-43e1-805f-30bed457b5dc",
            },
          })
          .catch((e) => console.error("Error creating slack_integration: ", e));
      })
      .catch((e) => console.log(e));
  }
}
