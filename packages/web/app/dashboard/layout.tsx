import type { Metadata } from "next";
import Nav from "./nav";

export const metadata: Metadata = {
  title: "Review Corral - Dashboard",
  description: "Review Corral Dashboard",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Nav />
      <main className="">
        <div className="max-w-7xl mx-auto py-6 px-7">{children}</div>
      </main>
    </div>
  );
}
