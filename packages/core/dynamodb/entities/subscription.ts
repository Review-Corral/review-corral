import { Entity } from "electrodb";

export const SubscriptionEntity = new Entity({
  model: {
    version: "1",
    entity: "Subscription",
    service: "rc",
  },
  attributes: {
    // 0 = not yet associated with an organization (sentinel value)
    orgId: {
      type: "number",
      required: true,
      default: 0,
    },
    customerId: {
      type: "string",
      readony: true,
      required: true,
    },
    subId: {
      type: "string",
      readony: true,
      required: true,
    },
    priceId: {
      type: "string",
      readOnly: true,
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
  },
  indexes: {
    primary: {
      pk: {
        field: "pk",
        composite: ["customerId"],
      },
      sk: {
        field: "sk",
        composite: ["subId"],
      },
    },
    byOrg: {
      index: "gsi1",
      pk: {
        field: "gsi1pk",
        composite: ["orgId"],
      },
      sk: {
        field: "gsi1sk",
        composite: ["subId"],
      },
    },
  },
});
