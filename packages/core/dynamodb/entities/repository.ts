import { Attribute, Entity } from "electrodb";
import { OrgIdAttr } from "./organization";

export const RepoIdAttr = {
  type: "number",
  required: true,
  readOnly: true,
} satisfies Attribute;

export const RepositoryEntity = new Entity({
  model: {
    version: "1",
    entity: "Repository",
    service: "rc",
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
});
