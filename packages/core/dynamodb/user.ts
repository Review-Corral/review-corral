import { CreateEntityItem, Entity, EntityItem } from "electrodb";
import { Dynamo } from "./dynamo";

export const UserEntity = new Entity(
  {
    model: {
      version: "1",
      entity: "User",
      service: "scratch",
    },
    attributes: {
      id: {
        type: "number",
        required: true,
        readOnly: true,
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
      createdAt: {
        type: "string",
        required: true,
        readOnly: true,
      },
    },
    indexes: {
      primary: {
        pk: {
          field: "pk",
          composite: [],
        },
        sk: {
          field: "sk",
          composite: ["id"],
        },
      },
    },
  },
  Dynamo.Configuration
);

export type ArticleEntityType = EntityItem<typeof UserEntity>;

export async function create(
  props: Omit<CreateEntityItem<typeof UserEntity>, "createdAt">
) {
  const result = await UserEntity.create({
    ...props,
    createdAt: new Date().toUTCString(),
  }).go();

  return result.data;
}

export async function get(id: number) {
  const result = await UserEntity.get({ id }).go();

  return result.data;
}

export async function list() {
  const result = await UserEntity.query.primary({}).go();

  return result.data;
}
