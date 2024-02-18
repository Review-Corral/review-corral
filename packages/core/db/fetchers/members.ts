import { Db } from "../../dynamodb";
import { Member, User } from "../../dynamodb/entities/types";

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
