import { Entity } from "electrodb";
import { Dynamo } from "../dynamo";

export const OrgIdAttr = {
  type: "number",
  required: true,
  readOnly: true,
  padding: {
    length: 20,
    char: "0",
  },
} as const;

export const OrganizationEntity = new Entity(
  {
    model: {
      version: "1",
      entity: "Organization",
      service: "scratch",
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
      type: {
        type: ["User", "Organization"] as const,
        required: true,
        readOnly: true,
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
          composite: ["createdAt"],
        },
      },
      pullRequests: {
        collection: "orgPullRequests",
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
      users: {
        collection: "users",
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
  },
  Dynamo.Configuration
);