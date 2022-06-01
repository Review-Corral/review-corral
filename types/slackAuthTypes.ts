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
