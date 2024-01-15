import Link from "next/link";

export default function Home() {
  return (
    <main>
      <div>Hello this is main</div>

      <Link href={"/login"}>Login</Link>
    </main>
  );
}
