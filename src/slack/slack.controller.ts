import { Body, Controller, Get, Query } from "@nestjs/common";
import axios from "axios";
import { RootObject } from "types/slackAuthTypes";

@Controller("/slack")
export class SlackController {
  @Get()
  getSlackAuthEvent(
    @Body() body: any,
    @Query() query: { code: string; state?: string },
  ) {
    console.log(body);
    console.log("query: ", query);

    // fetch("https://slack.com/api/oauth.v2.access", {
    //   body: `client_id=${process.env.SLACK_BOT_ID}&code=${query.code}&client_secret=${process.env.SLACK_SIGNING_SECRET}`,
    //   headers: {
    //     "Content-Type": "application/x-www-form-urlencoded",
    //   },
    //   method: "post",
    // });

    axios
      .postForm<
        {
          client_id: string;
          code: string;
          client_secret: string;
        },
        RootObject
      >("https://slack.com/api/oauth.v2.access", {
        client_id: process.env.SLACK_BOT_ID,
        code: query.code,
        client_secret: process.env.SLACK_SIGNING_SECRET,
      })
      .then((response) => console.log(response))
      .catch((e) => console.log(e));
  }
}
