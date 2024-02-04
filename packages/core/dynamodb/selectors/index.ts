import { CreateEntityItem } from "electrodb";
import { Db } from "../dynamo";
import { OrganizationEntity } from "../entities/orgnization";
import { UserEntity } from "../entities/user";

export async function createOrg(
  props: Omit<
    CreateEntityItem<typeof OrganizationEntity>,
    "createdAt" | "updatedAt"
  >
) {
  const result = await OrganizationEntity.create({
    ...props,
  }).go();

  return result.data;
}

export async function getOrg(id: number) {
  const result = await OrganizationEntity.query
    .primary({
      orgId: id,
    })
    .go();

  return result.data;
}

export async function getOrgPullRequests(orgId: number) {
  const result = await Db.collections
    .orgPullRequests({
      orgId,
    })
    .params({
      order: "desc",
    })
    .go();

  return result.data;
}

export async function createOrgUser(
  props: Omit<CreateEntityItem<typeof UserEntity>, "createdAt">
) {
  const result = await UserEntity.create({
    ...props,
    createdAt: new Date().toUTCString(),
  }).go();

  return result.data;
}

export async function getOrgUsers(orgId: number) {
  const result = await Db.collections.users({ orgId }).go();

  return result.data;
}
