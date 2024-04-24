import { User } from "@core/dynamodb/entities/types";
import ky from "ky";
import { useQuery } from "react-query";
import { getSessionToken } from "./getSessionToken";

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      return await ky
        .get(`${import.meta.env.VITE_API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
          },
        })
        .json<User>();
    },
  });
};
