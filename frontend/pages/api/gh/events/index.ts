import { WebClient } from "@slack/web-api";
import { NextApiRequest, NextApiResponse } from "next";
import withApiSupabase from "../../../../components/api/utils/withApiSupabase";

export default withApiSupabase(async function GithubEvents(
  req: NextApiRequest,
  res: NextApiResponse,
  supabaseClient,
) {
  console.info("Got event: ", req.body);

  if (
    req.body.pull_request &&
    req.body.pull_request.id &&
    req.body.repository.id
  ) {
    const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

    const { data, error } = await supabaseClient
      .from("github_repositories")
      .select(
        `
        id,
        organizations (*),
      `,
      )
      .eq("repository_id", req.body.repository.id)
      .limit(1)
      .single();

    const { data: slackIntegration, error: slackIntegrationError } =
      await supabaseClient
        .from("slack_integration")
        .select("*")
        .eq("team_id", req.body.repository.owner.id);

    // new GithubEventHandler(supabaseClient, slackClient);

    // const { data, error } = await supabaseClient.from("users").select("*");

    return res.status(200).end();
  }

  return res.status(200).end();
});
