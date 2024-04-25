import { Entity } from "electrodb";
import { OrgIdAttr } from "./organization";

export const SubscriptionEntity = new Entity({
  model: {
    version: "1",
    entity: "Subscription",
    service: "rc",
  },
  attributes: {
    orgId: OrgIdAttr,
    name: {
      type: "string",
      required: true,
    },
    priceId: {
      type: "string",
      required: true,
    },
    isActive: {
      type: "boolean",
      required: true,
      default: true,
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
        composite: ["isActive", "priceId"],
      },
    },
  },
});
