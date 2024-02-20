import { Entity } from "electrodb";
import { Configuration } from "..";
import { OrgIdAttr } from "./organization";

export const MemberEntity = new Entity(
  {
    model: {
      version: "1",
      entity: "Member",
      service: "rc",
    },
    attributes: {
      memberId: {
        type: "number",
        required: true,
        readOnly: true,
      },
      orgId: OrgIdAttr,
      name: {
        type: "string",
        required: true,
      },
      email: {
        type: "string",
        required: false,
      },
      avatarUrl: {
        type: "string",
        required: false,
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
          composite: ["orgId"],
        },
        sk: {
          field: "sk",
          composite: ["memberId"],
        },
      },
      membersOrgs: {
        index: "gsi3",
        pk: {
          field: "gsi3pk",
          composite: ["memberId"],
        },
        sk: {
          field: "gsi3sk",
          composite: ["orgId"],
        },
      },
    },
  },
  Configuration
);
