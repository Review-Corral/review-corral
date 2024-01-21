import { AuthedUser } from "@/app/dashboard/userActions";
import { assertVarExists } from "@core/utils/assert";

export const BASE_URL = assertVarExists("NEXT_PUBLIC_API_URL");

export const cFetch = async <T extends {}>(
  url: string,
  {
    user,
    method = "GET",
    body,
    tags,
  }: {
    user: AuthedUser;
    method?: string;
    body?: {};
    tags?: string[];
  }
) => {
  const fullUrl = `${BASE_URL}${url}`;
  console.log("fullUrl", fullUrl);

  return await fetch(fullUrl, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      Authorization: `Bearer ${user.authToken}`,
    },
    next: {
      tags: tags,
    },
  }).then((res) => res.json() as Promise<T>);
};
