import { WebClient } from "@slack/web-api";
import { NextApiRequest, NextApiResponse } from "next";
import { withAxiom } from "next-axiom";
import { AxiomAPIRequest } from "next-axiom/dist/withAxiom";
import { GithubEventHandler } from "../../../../components/api/gh/events/GithubEventHandler";
import { flattenType } from "../../../../components/api/utils/apiUtils";
import withApiSupabase from "../../../../components/api/utils/withApiSupabase";
import { Organization } from "../../../org/[accountId]";

export default withAxiom(
  withApiSupabase(async function GithubEvents(
    _req: NextApiRequest,
    res: NextApiResponse,
    supabaseClient,
  ) {
    const req = _req as AxiomAPIRequest;

    req.log.info("Got Github Event: ", req.body);

    if (
      req.body.pull_request &&
      req.body.pull_request.id &&
      req.body.repository.id
    ) {
      const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

      const { data: githubRepository, error } = await supabaseClient
        .from("github_repositories")
        .select(
          `
        id,
        organization:organizations (*)
      `,
        )
        .eq("repository_id", Number(req.body.repository.id))
        .limit(1)
        .single();

      const organization = flattenType<Organization>(
        githubRepository?.organization,
      );

      if (error) {
        req.log.info("Error finding Github Repository: ", error);
        return res.status(500).end();
      }

      if (!organization) {
        req.log.warn(
          "No organization found for repository_id: ",
          req.body.repository_id,
        );
        return res.status(404).end();
      }

      const { data: slackIntegration, error: slackIntegrationError } =
        await supabaseClient
          .from("slack_integration")
          .select("*")
          .eq("organization_id", organization.id)
          .limit(1)
          .single();

      if (slackIntegrationError) {
        req.log.warn(
          "Error finding Slack Integration: ",
          slackIntegrationError,
        );
        return res.status(404).end();
      }

      const eventHandler = new GithubEventHandler(
        supabaseClient,
        slackClient,
        slackIntegration.channel_id,
        slackIntegration.access_token,
        organization.installation_id,
        req.log,
      );

      try {
        await eventHandler.handleEvent(req.body);
      } catch (error) {
        req.log.error(`Got error handling event: ${error}`);
        return res.status(400).end();
      }
    }

    return res.status(200).end();
  }),
);
