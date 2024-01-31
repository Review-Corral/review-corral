import { CreateEntityItem, Entity, EntityItem } from "electrodb";
import { Dynamo } from "./dynamo";

export const OrganizationEntity = new Entity(
  {
    model: {
      version: "1",
      entity: "Organization",
      service: "scratch",
    },
    attributes: {
      orgId: {
        type: "number",
        required: true,
        readOnly: true,
      },
      name: {
        type: "string",
        required: true,
      },
      avatarUrl: {
        type: "string",
        required: true,
      },
      createdAt: {
        type: "string",
        required: true,
        readOnly: true,
      },
      type: {
        type: ["User", "Organization"] as const,
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
          composite: ["orgId"],
        },
      },
    },
  },
  Dynamo.Configuration
);

export type ArticleEntityType = EntityItem<typeof OrganizationEntity>;

export async function create(
  props: Omit<CreateEntityItem<typeof OrganizationEntity>, "createdAt">
) {
  const result = await OrganizationEntity.create({
    ...props,
    createdAt: new Date().toUTCString(),
  }).go();

  return result.data;
}

export async function get(id: number) {
  const result = await OrganizationEntity.get({ orgId: id }).go();

  return result.data;
}

export async function list() {
  const result = await OrganizationEntity.query.primary({}).go();

  return result.data;
}
