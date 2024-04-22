import { Organization } from "@core/dynamodb/entities/types";
import ky from "ky";
import { useQuery } from "react-query";
import { getSessionToken } from "src/auth/getSessionToken";

export const INSTALLATION_QUERY_KEY = "installation";

export const useOrganization = (orgId: number) => {
  return useQuery({
    queryKey: [INSTALLATION_QUERY_KEY],
    queryFn: async () => {
      return await ky
        .get(`${import.meta.env.VITE_API_URL}/org/${orgId}`, {
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
          },
        })
        .json<Organization>();
    },
  });
};
