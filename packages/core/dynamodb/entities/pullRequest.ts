import { Entity } from "electrodb";
import { Dynamo } from "..";

export const PullRequestEntity = new Entity(
  {
    model: {
      version: "1",
      entity: "PullRequest",
      service: "scratch",
    },
    attributes: {
      prId: {
        type: "number",
        required: true,
        readOnly: true,
        padding: {
          length: 20,
          char: "0",
        },
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
      isDraft: {
        type: "boolean",
        default: false,
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
          composite: ["orgId"],
        },
        sk: {
          field: "sk",
          composite: ["createdAt", "isDraft"],
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
          composite: ["prId"],
        },
      },
    },
  },
  Dynamo.Configuration
);
