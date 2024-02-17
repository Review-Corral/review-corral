import { CreateEntityItem } from "electrodb";
import { Db } from "..";
import { MemberEntity } from "../entities/member";
import { OrganizationEntity } from "../entities/organization";
import { PullRequestEntity } from "../entities/pullRequest";

type DateMetadataTypes = "createdAt" | "updatedAt";

export async function createOrg(
  props: Omit<CreateEntityItem<typeof OrganizationEntity>, DateMetadataTypes>
) {
  const result = await OrganizationEntity.create({
    ...props,
  }).go();

  return result.data;
}

export async function selectOrg(id: number) {
  const result = await OrganizationEntity.get({
    orgId: id,
  }).go();

  return result.data;
}

export async function selectOrgPrs(orgId: number) {
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

export async function insertOrgUser(
  props: Omit<CreateEntityItem<typeof MemberEntity>, "createdAt" | "updatedAt">
) {
  const result = await MemberEntity.create({
    ...props,
  }).go();

  return result.data;
}

export async function insertPr(
  props: Omit<CreateEntityItem<typeof PullRequestEntity>, DateMetadataTypes>
) {
  const result = await PullRequestEntity.create({
    ...props,
    createdAt: new Date().toUTCString(),
  }).go();

  return result.data;
}

export async function updatePr(
  props: Omit<CreateEntityItem<typeof PullRequestEntity>, DateMetadataTypes>
) {
  const { orgId, prId, ...remainingProps } = props;
  const result = await PullRequestEntity.update({
    orgId: orgId,
    prId: prId,
  })
    .set({
      ...remainingProps,
    })
    .go();

  return result.data;
}

export async function selectPullRequest(orgId: number, prId: number) {
  const result = await PullRequestEntity.get({
    orgId,
    prId,
  }).go();

  return result.data;
}

export async function selectOrgUsers(orgId: number) {
  const result = await Db.collections.users({ orgId }).go();

  return result.data;
}
