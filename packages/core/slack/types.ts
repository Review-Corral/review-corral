import { SlackClient } from "./SlackClient";

export type SlackIntegrationUsers = Awaited<
  ReturnType<typeof SlackClient.prototype.client.users.list>
>;
