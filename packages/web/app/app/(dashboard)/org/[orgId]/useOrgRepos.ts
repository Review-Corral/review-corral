import { getSessionToken } from "@/app/app/auth/getSessionToken";
import { Repository } from "@core/dynamodb/entities/types";
import { useQuery } from "@tanstack/react-query";
import ky from "ky";

export const reposKey = "repositories";

export const useOrganizationRepositories = (orgId: number) => {
  return useQuery({
    queryKey: [reposKey, orgId],
    queryFn: async () => {
      return await ky
        .get(`${process.env.NEXT_PUBLIC_API_URL}/gh/${orgId}/repositories`, {
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
          },
        })
        .json<Repository[]>();
    },
  });
};
