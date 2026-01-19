import { Entity } from "electrodb";

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

export const BillingStatusEntity = new Entity({
  model: {
    version: "1",
    entity: "BillingStatus",
    service: "rc",
  },
  attributes: {
    orgId: {
      type: "number",
      required: true,
      readOnly: true,
    },
    pastDueStartedAt: {
      type: "string",
      required: true,
    },
    lastWarningSentAt: {
      type: "string",
      required: false,
    },
    servicePausedSentAt: {
      type: "string",
      required: false,
    },
    expiresAt: {
      type: "number",
      required: true,
      default: () => Math.floor(Date.now() / 1000) + THIRTY_DAYS_SECONDS,
      set: () => Math.floor(Date.now() / 1000) + THIRTY_DAYS_SECONDS,
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
        composite: [],
      },
    },
  },
});
