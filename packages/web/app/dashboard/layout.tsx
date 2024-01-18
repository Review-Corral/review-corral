import type { Metadata } from "next";
import Nav from "./(navbar)/nav";

export const metadata: Metadata = {
  title: "Review Corral - Dashboard",
  description: "Review Corral Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Nav />
      <main>{children}</main>
    </div>
  );
}
