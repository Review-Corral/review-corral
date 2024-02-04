import { CreateEntityItem } from "electrodb";
import { Db } from "..";
import { OrganizationEntity } from "../entities/organization";
import { PullRequestEntity } from "../entities/pullRequest";
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
  const result = await OrganizationEntity.get({
    orgId: id,
  }).go();

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
  props: Omit<CreateEntityItem<typeof UserEntity>, "createdAt" | "updatedAt">
) {
  const result = await UserEntity.create({
    ...props,
  }).go();

  return result.data;
}

export async function createPullRequest(
  props: Omit<
    CreateEntityItem<typeof PullRequestEntity>,
    "createdAt" | "updatedAt"
  >
) {
  const result = await PullRequestEntity.create({
    ...props,
    createdAt: new Date().toUTCString(),
  }).go();

  return result.data;
}

export async function getOrgUsers(orgId: number) {
  const result = await Db.collections.users({ orgId }).go();

  return result.data;
}
