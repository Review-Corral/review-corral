import { User } from "@core/dynamodb/entities/types";
import { useQuery } from "@tanstack/react-query";
import ky from "ky";
import { getSessionToken } from "@/lib/auth/getSessionToken";

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
