import { Attribute, Entity } from "electrodb";
import { Configuration } from "..";
import { OrgIdAttr } from "./organization";

export const RepoIdAttr = {
  type: "number",
  required: true,
  readOnly: true,
  padding: {
    length: 20,
    char: "0",
  },
} satisfies Attribute;

export const RepositoryEntity = new Entity(
  {
    model: {
      version: "1",
      entity: "Repository",
      service: "scratch",
    },
    attributes: {
      orgId: OrgIdAttr,
      repoId: RepoIdAttr,
      name: {
        type: "string",
        required: true,
      },
      avatarUrl: {
        type: "string",
        required: false,
      },
      isEnabled: {
        type: "boolean",
        required: true,
        default: false,
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
          composite: ["repoId"],
        },
      },
    },
  },
  Configuration
);
