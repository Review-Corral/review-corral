import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  // async subscribeTeam(queryParams: SlackAuthQueryParams) {
  //   if (!queryParams.state) {
  //     throw new BadRequestException(
  //       "Trying to subscribe team without state query param",
  //     );
  //   }

  //   this.prisma.team
  //     .findUnique({
  //       where: { id: queryParams.state },
  //       rejectOnNotFound: true,
  //     })
  //     .catch((e) => {
  //       throw new BadRequestException("Invalid team id provided");
  //     })
  //     .then(() => {
  //       axios
  //         .postForm<
  //           {
  //             client_id: string;
  //             code: string;
  //             client_secret: string;
  //           },
  //           { data: SlackAuthEvent }
  //         >("https://slack.com/api/oauth.v2.access", {
  //           client_id: process.env.SLACK_BOT_ID,
  //           code: queryParams.code,
  //           client_secret: process.env.SLACK_CLIENT_SECRET,
  //         })
  //         .then(({ data }) => {
  //           console.log(data);
  //           this.prisma.slack_integration
  //             .create({
  //               data: {
  //                 access_token: data.access_token,
  //                 channel_id: data.incoming_webhook.channel_id,
  //                 channel_name: data.incoming_webhook.channel,
  //                 team: queryParams.state,
  //               },
  //             })
  //             .catch((e) =>
  //               console.error("Error creating slack_integration: ", e),
  //             );
  //         })
  //         .catch((e) => console.log(e));
  //     });
  // }
}
