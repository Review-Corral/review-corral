import { CreateEntityItem, Entity, EntityItem } from "electrodb";
import { Dynamo } from "..";
import { OrgIdAttr } from "./orgnization";

export const UserEntity = new Entity(
  {
    model: {
      version: "1",
      entity: "User",
      service: "scratch",
    },
    attributes: {
      orgId: OrgIdAttr,
      userId: {
        type: "number",
        required: true,
        readOnly: true,
        padding: {
          length: 20,
          char: "0",
        },
      },
      name: {
        type: "string",
        required: true,
      },
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
      status: {
        type: ["standard", "admin"] as const,
        default: "standard",
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
        type: "clustered",
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
