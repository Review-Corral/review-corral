import { Entity } from "electrodb";
import { OrgIdAttr } from "./organization";
import { RepoIdAttr } from "./repository";

export const BranchEntity = new Entity({
  model: {
    version: "1",
    entity: "Branch",
    service: "rc",
  },
  attributes: {
    branchName: {
      type: "number",
      required: true,
      readOnly: true,
    },
    orgId: OrgIdAttr,
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
        composite: ["orgId"],
      },
      sk: {
        field: "sk",
        composite: ["repoId", "branchName"],
      },
    },
  },
});
