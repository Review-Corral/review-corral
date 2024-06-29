import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <h1>Review Corral</h1>
        <div>
          <Link href={"/app/auth/login"}>Login</Link>
        </div>
      </div>
    </main>
  );
}
