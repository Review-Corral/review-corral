import { Entity } from "electrodb";
import { Dynamo } from "./dynamo";

export const OrganizationEntity = new Entity(
  {
    model: {
      version: "1",
      entity: "Organization",
      service: "scratch",
    },
    attributes: {
      id: {
        type: "number",
        required: true,
        readOnly: true,
      },
      threadTs: {
        type: "string",
        required: true,
      },
      orgId: {
        type: "number",
        required: true,
        readOnly: true,
      },
      createdAt: {
        type: "string",
        required: true,
        readOnly: true,
      },
      draft: {
        type: "boolean",
        default: false,
        required: true,
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
      assigned: {
        collection: "pullRequests",
        index: "gsi2",
        pk: {
          field: "gsi2pk",
          composite: ["orgId"],
        },
        sk: {
          field: "gsi2sk",
          composite: ["projectId"],
        },
      },
    },
  },
  Dynamo.Configuration
);
