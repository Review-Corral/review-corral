import { BranchEntity } from "@core/dynamodb/entities/branch";
import { Branch } from "@core/dynamodb/entities/types";
import { Db } from "../client";

export const fetchBranch = async (args: {
  repoId: number;
  branchName: string;
}): Promise<Branch | null> => {
  return await Db.entities.branch
    .get(args)
    .go()
    .then(({ data }) => data);
};

export const insertBranch = async (args: Parameters<typeof BranchEntity.create>[0]) => {
  return await Db.entities.branch
    .create(args)
    .go()
    .then(({ data }) => data);
};

export const updateBranch = async (args: {
  branchName: string;
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
