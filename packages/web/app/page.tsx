import Link from "next/link";

export default function Home() {
  return (
    <main className="text-red-500">
      Hello this is main
      <Link href={"/login"}>Login</Link>
    </main>
  );
}
