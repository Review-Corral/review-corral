import { Entity } from "electrodb";
import { Dynamo } from "../dynamo";

export const PullRequestEntity = new Entity(
  {
    model: {
      version: "1",
      entity: "PullRequest",
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
        collection: "orgPullRequests",
        index: "gsi1",
        pk: {
          field: "gsi1pk",
          composite: ["orgId"],
        },
        sk: {
          field: "gsi1sk",
          composite: ["projectId"],
        },
      },
    },
  },
  Dynamo.Configuration
);
