import { Entity } from "electrodb";

export const SlackApiThrottleEntity = new Entity({
  model: {
    version: "1",
    entity: "SlackApiThrottle",
    service: "rc",
  },
  attributes: {
    slackTeamId: {
      type: "string",
      required: true,
      readOnly: true,
    },
    requestType: {
      type: "string",
      required: true,
      readOnly: true,
    },
    requestTime: {
      type: "string",
      required: true,
      default: () => new Date().toISOString(),
      set: () => new Date().toISOString(),
    },
    expiresAt: {
      type: "number",
      required: true,
      // Set TTL to expire records after 15 minutes (cleanup)
      default: () => Math.floor(Date.now() / 1000) + 15 * 60,
      set: () => Math.floor(Date.now() / 1000) + 15 * 60,
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
        composite: ["requestType"],
      },
    },
  },
});
