import { Branch } from "@core/dynamodb/entities/types";
import { Db } from "../client";
import { BranchEntity } from "@core/dynamodb/entities/branch";

export const getBranch = async (
  args: Parameters<typeof BranchEntity.get>[0],
): Promise<Branch | null> => {
  return await Db.entities.branch
    .get(args)
    .go()
    .then(({ data }) => (data.length > 0 ? data[0] : null));
};

export const insertBranch = async (args: Parameters<typeof BranchEntity.create>[0]) => {
  return await Db.entities.branch
    .create(args)
    .go()
    .then(({ data }) => data);
};

export const updateBranch = async (args: {
  branchName: number;
  orgId: number;
  repoId: number;
  requiredApprovals: number;
}) => {
  await Db.entities.branch
    .patch(args)
    .set({
      requiredApprovals: args.requiredApprovals,
    })
    .go({
      response: "none",
    });
};
