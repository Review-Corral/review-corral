import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "types/database-types";

export default async function Signout() {
  const supabase = createServerComponentClient<Database>({ cookies });

  await supabase.auth.signOut();
  redirect("/login");
}
