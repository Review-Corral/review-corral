import { getSessionToken } from "@auth/getSessionToken";
import { Organization } from "@core/dynamodb/entities/types";
import { useQuery } from "@tanstack/react-query";
import ky from "ky";

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
