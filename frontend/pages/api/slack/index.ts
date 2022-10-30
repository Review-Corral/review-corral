import axios from "axios";
import { isValidBody } from "../../../components/api/utils/apiUtils";
import withApiSupabase from "../../../components/api/utils/withApiSupabase";
import { Database } from "../../../database-types";

export type SlackAuthQueryParams = {
  code: string;
  state: string; // should be organization ID
};

export interface SlackAuthEvent {
  ok: boolean;
  app_id: string;
  scope: string;
  access_token: string;
  team: Team;
  incoming_webhook: IncomingWebhook;
}

export interface Team {
  name: string;
  id: string;
}

export interface IncomingWebhook {
  channel: string;
  channel_id: string;
  configuration_url: string;
  url: string;
}

export default withApiSupabase<Database>(async function ProtectedRoute(
  req,
  res,
  supabaseServerClient,
) {
  if (
    req.method === "GET" ||
    !isValidBody<SlackAuthQueryParams>(req.body, ["code", "state"])
  ) {
    console.info("Got request to GET /api/slack");
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
        code: req.body.code,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        redirect_uri: process.env.SLACK_REDIRECT_URL,
      })
      .then(async ({ data }) => {
        const { error } = await supabaseServerClient
          .from("slack_integration")
          .insert({
            access_token: data.access_token,
            channel_id: data.incoming_webhook.channel_id,
            channel_name: data.incoming_webhook.channel,
            organization_id: req.body.state,
            slack_team_name: data.team.name,
            slack_team_id: data.team.id,
          });

        if (error) {
          console.error(
            `Error inserting slack_integration for ${req.body.state}: ${error}`,
          );
          return res.status(500).end();
        }

        return res.status(200).end();
      })
      .catch((error) => {
        console.error(
          `Error for oAuth with Slack for ${req.body.state}: ${error}`,
        );
        return res.status(500).end();
      });
  } else {
    return res.status(404);
  }
});
