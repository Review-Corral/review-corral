import { Entity } from "electrodb";
import { Configuration } from "..";
import { OrgIdAttr } from "./organization";

export const UserAndOrganization = new Entity(
  {
    model: {
      version: "1",
      entity: "User",
      service: "scratch",
    },
    attributes: {
      orgId: OrgIdAttr,
      userId: {
        type: "number",
        required: true,
        readOnly: true,
        padding: {
          length: 20,
          char: "0",
        },
      },
      slackId: {
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
    },
    indexes: {
      primary: {
        pk: {
          field: "pk",
          composite: ["userId"],
        },
        sk: {
          field: "sk",
          composite: ["orgId"],
        },
      },
      orgUsers: {
        collection: "users",
        index: "gsi2",
        type: "clustered",
        pk: {
          field: "gsi2pk",
          composite: ["orgId"],
        },
        sk: {
          field: "gsi2sk",
          composite: ["userId", "status"],
        },
      },
    },
  },
  Configuration
);
