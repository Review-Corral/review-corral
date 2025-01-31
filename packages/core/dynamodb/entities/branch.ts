import { Entity } from "electrodb";
import { RepoIdAttr } from "./repository";

export const BranchEntity = new Entity({
  model: {
    version: "1",
    entity: "Branch",
    service: "rc",
  },
  attributes: {
    branchName: {
      type: "string",
      required: true,
      readOnly: true,
    },
    repoId: RepoIdAttr,
    name: {
      type: "string",
      required: true,
    },
    requiredApprovals: {
      type: "number",
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
        composite: ["repoId"],
      },
      sk: {
        field: "sk",
        composite: ["branchName"],
      },
    },
  },
});
