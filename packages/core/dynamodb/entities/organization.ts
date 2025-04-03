import { Attribute, Entity } from "electrodb";

export const OrgIdAttr = {
  type: "number",
  required: true,
  readOnly: true,
} satisfies Attribute;

export const OrganizationEntity = new Entity({
  model: {
    version: "1",
    entity: "Organization",
    service: "rc",
  },
  attributes: {
    orgId: OrgIdAttr,
    name: {
      type: "string",
      required: true,
    },
    avatarUrl: {
      type: "string",
      required: true,
    },
    billingEmail: {
      type: "string",
      required: false,
    },
    installationId: {
      type: "number",
      required: true,
    },
    type: {
      type: ["User", "Organization"] as const,
      required: true,
      readOnly: true,
    },
    // =============
    // Stripe Stuff
    // =============
    customerId: {
      type: "string",
      required: false,
    },
    stripeSubStatus: {
      type: "string",
      required: false,
    },
    // =============
    // END Stripe Stuff
    // =============
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
        composite: [],
      },
    },
    repositories: {
      collection: "orgRepositories",
      index: "gsi1",
      pk: {
        field: "gsi1pk",
        composite: ["orgId"],
      },
      sk: {
        field: "gsi1sk",
        composite: ["createdAt"],
      },
    },
    members: {
      collection: "orgMembers",
      index: "gsi2",
      pk: {
        field: "gsi2pk",
        composite: ["orgId"],
      },
      sk: {
        field: "gsi2sk",
        composite: [],
      },
    },
  },
});
