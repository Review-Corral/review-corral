import { Repository } from "@core/db/types";
import ky from "ky";
import { useQuery } from "react-query";
import { getSessionToken } from "src/auth/getSessionToken";

export const reposKey = "repositories";

export const useOrganizationRepositories = (orgId: number) => {
  return useQuery({
    queryKey: [reposKey, orgId],
    queryFn: async () => {
      return await ky
        .get(
          `${
            import.meta.env.VITE_API_URL
          }/gh/installations/${orgId}/repositories`,
          {
            headers: {
              Authorization: `Bearer ${getSessionToken()}`,
            },
          }
        )
        .json<Repository[]>();
    },
  });
};
