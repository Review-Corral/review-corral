import { WebClient } from "@slack/web-api";
import { withAxiom } from "next-axiom";
import { GithubEventHandler } from "../../../../components/api/gh/events/GithubEventHandler";
import { flattenType } from "../../../../components/api/utils/apiUtils";
import { withProtectedApi } from "../../../../components/api/utils/withProtectedApi";
import { Organization } from "../../../org/[accountId]";

export default withAxiom(
  withProtectedApi(async function GithubEvents(req, res, supabaseClient) {
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
        return res
          .status(500)
          .send({ error: "Error finding Github Repository" });
      }

      if (!organization) {
        req.log.warn(
          "No organization found for repository_id: ",
          req.body.repository_id,
        );
        return res.status(404).send({ error: "No organization found" });
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
        return res.status(404).send({ error: "No organization found" });
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
        return res.status(400).send({ error: "Error handling event" });
      }
    }

    return res.status(200).end();
  }),
);
