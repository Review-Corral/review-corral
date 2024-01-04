import { Organization } from "@core/db/types";
import ky from "ky";
import { useQuery } from "react-query";
import { getSessionToken } from "src/auth/getSessionToken";

export const INSTALLATIONS_QUERY_KEY = "installations";

export const useOrganizations = () => {
  return useQuery({
    queryKey: [INSTALLATIONS_QUERY_KEY],
    queryFn: async () => {
      return await ky
        .get(`${import.meta.env.VITE_API_URL}/gh/installations`, {
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
          },
        })
        .json<Organization[]>();
    },
  });
};
