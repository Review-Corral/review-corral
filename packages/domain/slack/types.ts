import { Member } from "@slack/web-api/dist/response/UsersListResponse";
import { SlackClient } from "./SlackClient";

export type SlackIntegrationUsersResponse = Awaited<
  ReturnType<typeof SlackClient.prototype.client.users.list>
>;
export type SlackIntegrationUsers = Member[];
