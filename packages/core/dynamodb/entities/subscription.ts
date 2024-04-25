import { Entity } from "electrodb";
import { OrgIdAttr } from "./organization";

export const SubscriptionEntity = new Entity({
  model: {
    version: "1",
    entity: "Subscription",
    service: "rc",
  },
  attributes: {
    subId: {
      type: "string",
      required: true,
    },
    orgId: OrgIdAttr,
    priceId: {
      type: "string",
      required: true,
    },
    // Possible values are:
    // incomplete, incomplete_expired, trialing, active, past_due, canceled, unpaid, or paused.
    status: {
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
    cancelledAt: {
      type: "string",
      required: false,
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
        composite: ["status", "priceId"],
      },
    },
  },
});
