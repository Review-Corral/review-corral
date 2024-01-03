import { User } from "@core/db/types";
import ky from "ky";
import { useQuery } from "react-query";
import { getSessionToken } from "./getSessionToken";

type UseUserResponse =
  | {
      user: User;
      error: null;
    }
  | {
      user: null;
      error: {
        code: 401;
        message: "User not logged in";
      };
    };

export const useUser = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      return await ky
        .get(`${import.meta.env.VITE_API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
          },
        })
        .json();
    },
  });
};
