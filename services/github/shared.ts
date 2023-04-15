import { Db } from "services/db";
import { SlackClient } from "services/slack/SlackClient";

export interface BasePrEventHandlerProps {
  database: Db;
  slackClient: SlackClient;
  organizationId: string;
  getSlackUserName: (githubLogin: string) => Promise<string>;
  installationId: number;
}
