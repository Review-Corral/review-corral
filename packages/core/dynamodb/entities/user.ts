import { CreateEntityItem, Entity, EntityItem } from "electrodb";
import { Dynamo } from "../dynamo";
import { OrgIdAttr } from "./orgnization";

export const UserEntity = new Entity(
  {
    model: {
      version: "1",
      entity: "User",
      service: "scratch",
    },
    attributes: {
      userId: {
        type: "number",
        required: true,
        readOnly: true,
        padding: {
          length: 20,
          char: "0",
        },
      },
      orgId: OrgIdAttr,
      email: {
        type: "string",
        required: true,
      },
      avatarUrl: {
        type: "string",
        required: false,
      },
      ghAccessToken: {
        type: "string",
        required: false,
      },
      createdAt: {
        type: "string",
        required: true,
        readOnly: true,
      },
      status: {
        type: ["standard", "admin"] as const,
        default: "standard",
        required: true,
      },
    },
    indexes: {
      primary: {
        pk: {
          field: "pk",
          composite: ["userId"],
        },
        sk: {
          field: "sk",
          composite: [],
        },
      },
      orgUsers: {
        collection: "users",
        index: "gsi1",
        pk: {
          field: "gsi1pk",
          composite: ["orgId"],
        },
        sk: {
          field: "gsi1sk",
          composite: ["createdAt", "status"],
        },
      },
    },
  },
  Dynamo.Configuration
);

export type UserEntityType = EntityItem<typeof UserEntity>;

export async function create(
  props: Omit<CreateEntityItem<typeof UserEntity>, "createdAt">
) {
  const result = await UserEntity.create({
    ...props,
    createdAt: new Date().toUTCString(),
  }).go();

  return result.data;
}

export async function get({ userId }: { userId: number }) {
  const result = await UserEntity.get({ userId }).go();

  return result.data;
}
