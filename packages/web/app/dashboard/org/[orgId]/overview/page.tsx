"use server";

import { Header } from "@/components/ui/header";
import { OrgViewPathParams } from "../types";

export default async function OverviewPage({
  params,
}: {
  params: OrgViewPathParams;
}) {
  return (
    <div className="space-y-12">
      <Header>Overview</Header>
    </div>
  );
}
