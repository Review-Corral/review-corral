import Link from "next/link";
import { fetchUserOptional } from "./dashboard/userActions";

export default async function Home() {
  const user = await fetchUserOptional();

  return (
    <main>
      <div>Welcome to Review Corral!</div>

      <Link href={"/dashboard"}>Dashboard</Link>

      <div>
        {user ? (
          <div>
            <div>Logged in as {user.id}</div>
            <Link href={"/logout"}>Logout</Link>
          </div>
        ) : (
          <div>
            <Link href={"/login"}>Login</Link>
          </div>
        )}
      </div>
    </main>
  );
}
