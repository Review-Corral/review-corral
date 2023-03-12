import { WebClient } from "@slack/web-api";

export const getSlackClient = () => new WebClient(process.env.SLACK_BOT_TOKEN);
