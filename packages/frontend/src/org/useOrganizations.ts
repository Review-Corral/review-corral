import { Organization } from "@core/db/types";
import Cookies from "js-cookie";
import ky from "ky";
import { useQuery } from "react-query";
import { auth_access_token_key } from "../auth/const";

export const INSTALLATIONS_QUERY_KEY = "installations";

export const useOrganizations = () => {
  return useQuery({
    queryKey: [INSTALLATIONS_QUERY_KEY],
    queryFn: async () => {
      return await ky
        .get(`${import.meta.env.VITE_API_URL}/installations`, {
          headers: {
            Authorization: `Bearer ${Cookies.get(auth_access_token_key)}`,
          },
        })
        .json<Organization[]>();
    },
  });
};
