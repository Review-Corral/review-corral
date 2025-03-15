"use client";

import { useParams } from "next/navigation";
import { Navbar } from "./Navbar";

export function NavbarWithOrgContext() {
  const params = useParams();

  // Get orgId from route params if available
  const orgId = params?.orgId ? Number.parseInt(params.orgId as string, 10) : undefined;

  return <Navbar activeOrgId={orgId} />;
}
