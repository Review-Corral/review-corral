import { githubWebhookBody } from ".";

import { WebhookEventMap } from "@octokit/webhooks-types";
import { SlackClient } from "../../slack/SlackClient";

export type handledEventNames = keyof Pick<
  WebhookEventMap,
  "pull_request" | "pull_request_review_comment" | "pull_request_review"
>;

export interface GithubWebhookEventHanderArgs {
  event: githubWebhookBody;
  slackClient: SlackClient;
  organizationId: number;
  installationId: number;
}

export type GithubWebhookEventHander = (
  args: GithubWebhookEventHanderArgs
) => Promise<void>;
