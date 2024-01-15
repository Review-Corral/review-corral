"use server";

import { assertVarExists } from "@core/utils/assert";
import ky from "ky";
import { redirect } from "next/navigation";

export async function login() {
  const authUri = assertVarExists("NEXT_PUBLIC_AUTH_URL");

  const payload = await ky.get(authUri).json<{ github: string }>();
  redirect(payload.github);
}
