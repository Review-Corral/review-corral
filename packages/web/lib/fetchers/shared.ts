import { AuthedUser } from "@/app/dashboard/userActions";
import { assertVarExists } from "@core/utils/assert";
import ky from "ky";

export const BASE_URL = assertVarExists("NEXT_PUBLIC_API_URL");

export const kyGet = async <T extends {}>(url: string, user: AuthedUser) => {
  const fullUrl = `${BASE_URL}${url}`;
  console.log("fullUrl", fullUrl);
  return await ky
    .get(fullUrl, {
      headers: {
        Authorization: `Bearer ${user.authToken}`,
      },
    })
    .json<T>();
};
