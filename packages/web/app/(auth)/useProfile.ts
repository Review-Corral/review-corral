import { User } from "@core/dynamodb/entities/types";
import { useQuery } from "@tanstack/react-query";
import ky from "ky";
import { getSessionToken } from "./getSessionToken";

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      return await ky
        .get(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
          },
        })
        .json<User>();
    },
  });
};
