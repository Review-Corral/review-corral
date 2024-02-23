import { Db } from "../client";
import { Member, User } from "../entities/types";

export const getOrganizationMembers = async (
  orgId: number
): Promise<Member[]> => {
  return await Db.entities.member.query
    .primary({
      orgId,
    })
    .go()
    .then(({ data }) => data);
};

export const addOrganizationMember = async ({
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
