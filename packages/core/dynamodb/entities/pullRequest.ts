import { Entity } from "electrodb";
import { Configuration } from "..";
import { RepoIdAttr } from "./repository";

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
      repoId: RepoIdAttr,
      threadTs: {
        type: "string",
        required: true,
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
          composite: ["repoId", "prId"],
        },
        sk: {
          field: "sk",
          composite: [],
        },
      },
    },
  },
  Configuration
);
