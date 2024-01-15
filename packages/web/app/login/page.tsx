import { Button } from "@/components/ui/button";
import { assertVarExists } from "@core/utils/assert";
import ky from "ky";
import { redirect } from "next/navigation";

export default function Login() {
  // Server Action
  async function login() {
    "use server";

    const authUri = assertVarExists("NEXT_PUBLIC_AUTH_URL");

    const payload = await ky.get(authUri).json<{ github: string }>();
    redirect(payload.github);
  }

  return (
    <div>
      <h1>Login page</h1>
      <form action={login}>
        <Button type="submit">Login to Github</Button>
      </form>
    </div>
  );
}
