import { Entity } from "electrodb";
import { OrgIdAttr } from "./organization";

const minuteInMillisecond = 60 * 1000;

// This entity is used primarily for caching reasons since the Slack API rate limiting
// for this request is quite aggressive
export const SlackUserEntity = new Entity({
  model: {
    version: "1",
    entity: "SlackUser",
    service: "rc",
  },
  attributes: {
    slackUserId: {
      type: "string",
      required: true,
      readOnly: true,
    },
    orgId: OrgIdAttr,
    slackTeamId: {
      type: "string",
      required: true,
    },
    realNameNormalized: {
      type: "string",
      required: true,
    },
    isBot: {
      type: "boolean",
      required: true,
      default: false,
    },
    isOwner: {
      type: "boolean",
      required: true,
      default: false,
    },
    isAdmin: {
      type: "boolean",
      required: true,
      default: false,
    },
    email: {
      type: "string",
      required: false,
    },
    image48: {
      type: "string",
      required: false,
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
    // epoch format to expire the item using ttl settings of the table
    expireAt: {
      type: "number",
      readOnly: true,
      required: true,
      default: () => Date.now() + minuteInMillisecond,
      set: () => Date.now() + minuteInMillisecond,
    },
  },
  indexes: {
    primary: {
      pk: {
        field: "pk",
        composite: ["slackTeamId"],
      },
      sk: {
        field: "sk",
        composite: ["updatedAt", "slackUserId"],
      },
    },
  },
});
