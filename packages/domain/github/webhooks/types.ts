import { SlackClient } from "@domain/slack/SlackClient";
import { WebhookEventMap } from "@octokit/webhooks-types";

export type handledEventNames = keyof Pick<
  WebhookEventMap,
  | "pull_request"
  | "pull_request_review_comment"
  | "pull_request_review"
  | "issue_comment"
  | "check_suite"
  | "check_run"
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
