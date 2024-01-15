"use server";

import { User } from "@core/db/types";
import ky from "ky";
import { cookies } from "next/headers";

export async function useUser() {
  const cookieStore = cookies();
  const authToken = cookieStore.get("authToken");

  console.log({ authToken });

  const user = await ky
    .get(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${authToken?.value}`,
      },
    })
    .json<User>();

  return user;
}
