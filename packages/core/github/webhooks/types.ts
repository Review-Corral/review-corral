import { WebhookEventMap } from "@octokit/webhooks-types";
import { SlackClient } from "../../slack/SlackClient";

export type handledEventNames = keyof Pick<
  WebhookEventMap,
  | "pull_request"
  | "pull_request_review_comment"
  | "pull_request_review"
  | "issue_comment"
>;

export interface GithubWebhookEventHanderArgs<EventT> {
  event: EventT;
  slackClient: SlackClient;
  organizationId: number;
  installationId: number;
}

export type BaseGithubWebhookEventHanderArgs = Omit<
  GithubWebhookEventHanderArgs<any>,
  "event"
>;

export type GithubWebhookEventHander<EventT> = (
  args: GithubWebhookEventHanderArgs<EventT>,
) => Promise<void>;
