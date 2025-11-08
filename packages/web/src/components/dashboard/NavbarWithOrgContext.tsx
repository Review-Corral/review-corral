"use client";

import { useParams } from "@tanstack/react-router";
import { Navbar } from "./Navbar";

export function NavbarWithOrgContext() {
  const params = useParams({ strict: false });

  // Get orgId from route params if available
  const orgId = params?.orgId ? Number.parseInt(params.orgId as string, 10) : undefined;

  return <Navbar activeOrgId={orgId} />;
}
