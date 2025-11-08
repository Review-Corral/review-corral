import { getSessionToken } from "@/lib/auth/getSessionToken";
import { Organization } from "@core/dynamodb/entities/types";
import { useQuery } from "@tanstack/react-query";
import ky from "ky";

export const INSTALLATION_QUERY_KEY = "installation";

export const useOrganization = (orgId: number) => {
  return useQuery({
    queryKey: [INSTALLATION_QUERY_KEY, orgId],
    queryFn: async () => {
      return await ky
        .get(`${process.env.NEXT_PUBLIC_API_URL}/org/${orgId}`, {
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
          },
        })
        .json<Organization>();
    },
  });
};
