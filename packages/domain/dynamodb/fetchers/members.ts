import { Member, User } from "@core/dynamodb/entities/types";
import { UpdateMemberArgs } from "@core/fetchTypes/updateOrgMember";
import { OrgMembers } from "@domain/github/endpointTypes";
import { Db } from "../client";

export const getOrganizationMembers = async (orgId: number): Promise<Member[]> => {
  return await Db.entities.member.query
    .primary({
      orgId,
    })
    .go()
    .then(({ data }) => data);
};

export const updateOrgMember = async (
  updateArgs: UpdateMemberArgs,
): Promise<Member> => {
  return await Db.entities.member
    .patch({
      memberId: updateArgs.memberId,
      orgId: updateArgs.orgId,
    })
    .set({
      slackId: updateArgs.slackId ?? undefined,
    })
    .go({
      response: "all_new",
    })
    .then(({ data }) => data);
};

export const addOrganizationMemberFromUser = async ({
  orgId,
  user,
}: {
  orgId: number;
  user: User;
}) => {
  return await Db.entities.member
    .create({
      orgId,
      memberId: user.userId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    })
    .go()
    .then(({ data }) => data);
};

export const addOrganizationMembers = async (orgId: number, members: OrgMembers) => {
  const memebersToInsert = members.map((m) => ({
    orgId,
    memberId: m.id,
    name: m.login,
    email: m.email ?? undefined,
    avatarUrl: m.avatar_url,
  }));

  return await Db.entities.member.put(memebersToInsert).go();
};

export const getOrgMember = async ({
  orgId,
  githubUsername,
}: {
  orgId: number;
  githubUsername: string;
}): Promise<Member | undefined> => {
  const allOrgMembers = await Db.entities.member.query
    .primary({ orgId })
    .go()
    .then(({ data }) => data);

  return allOrgMembers.find((member) => member.name === githubUsername);
};
