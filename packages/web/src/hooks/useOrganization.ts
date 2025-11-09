import { getSessionToken } from "@/lib/auth/getSessionToken";
import { Organization } from "@core/apiTypes";
import { useQuery } from "@tanstack/react-query";
import ky from "ky";

export const INSTALLATION_QUERY_KEY = "installation";

export const useOrganization = (orgId: number) => {
  return useQuery({
    queryKey: [INSTALLATION_QUERY_KEY, orgId],
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
