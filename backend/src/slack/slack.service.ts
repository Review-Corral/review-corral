import { BadRequestException, Injectable } from "@nestjs/common";
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
    if (!queryParams.state) {
      throw new BadRequestException(
        "Trying to subscribe team without state query param",
      );
    }

    this.prisma.team
      .findUnique({
        where: { id: queryParams.state },
        rejectOnNotFound: true,
      })
      .catch((e) => {
        throw new BadRequestException("Invalid team id provided");
      })
      .then(() => {
        axios
          .postForm<
            {
              client_id: string;
              code: string;
              client_secret: string;
              redirect_uri: string;
            },
            { data: SlackAuthEvent }
          >("https://slack.com/api/oauth.v2.access", {
            client_id: process.env.SLACK_BOT_ID,
            code: queryParams.code,
            client_secret: process.env.SLACK_CLIENT_SECRET,
            redirect_uri: process.env.SLACK_REDIRECT_URL,
          })
          .then(({ data }) => {
            console.log("Data back from slack oauthv2: ", data);
            this.prisma.slack_integration
              .create({
                data: {
                  access_token: data.access_token,
                  channel_id: data.incoming_webhook.channel_id,
                  channel_name: data.incoming_webhook.channel,
                  team: queryParams.state,
                },
              })
              .catch((e) =>
                console.error("Error creating slack_integration: ", e),
              );
          })
          .catch((e) => console.log("Error posting slack auth: ", e));
      });
  }
}
