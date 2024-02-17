import { Entity } from "electrodb";
import { Configuration } from "..";
import { OrgIdAttr } from "./organization";

export const MemberEntity = new Entity(
  {
    model: {
      version: "1",
      entity: "Member",
      service: "scratch",
    },
    attributes: {
      memberId: {
        type: "number",
        required: true,
        readOnly: true,
        padding: {
          length: 14,
          char: "0",
        },
      },
      orgId: OrgIdAttr,
      name: {
        type: "string",
        required: true,
      },
      email: {
        type: "string",
      },
      avatarUrl: {
        type: "string",
        required: false,
      },
      ghAccessToken: {
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
    },
  },
  Configuration
);
