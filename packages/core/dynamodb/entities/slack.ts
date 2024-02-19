import { Entity } from "electrodb";
import { Configuration } from "..";
import { OrgIdAttr } from "./organization";

export const SlackEntity = new Entity(
  {
    model: {
      version: "1",
      entity: "Slack",
      service: "rc",
    },
    attributes: {
      orgId: OrgIdAttr,
      accessToken: {
        type: "string",
        required: true,
      },
      channelId: {
        type: "string",
        required: true,
      },
      channelName: {
        type: "string",
        required: true,
      },
      slackTeamId: {
        type: "string",
        required: true,
      },
      slackTeamName: {
        type: "string",
        required: true,
      },
      createdAt: {
        type: "string",
        readOnly: true,
        required: true,
        default: () => new Date().toISOString(),
        set: () => new Date().toISOString(),
      },
      updatedAt: {
        type: "string",
        watch: "*",
        required: true,
        default: () => new Date().toISOString(),
        set: () => new Date().toISOString(),
      },
    },
    indexes: {
      primary: {
        pk: {
          field: "pk",
          composite: ["orgId"],
        },
        sk: {
          field: "sk",
          composite: ["slackTeamId", "channelId"],
        },
      },
    },
  },
  Configuration
);
