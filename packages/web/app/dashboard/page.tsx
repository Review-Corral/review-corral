import { useOrganizations } from "@/lib/fetchers/organizations";
import { Suspense } from "react";
import { useUser } from "./userActions";

export default async function DashboardHome() {
  const user = await useUser();
  const organizations = await useOrganizations(user);

  return (
    <div className="h-full w-full">
      <Suspense fallback={<div>Loading...</div>}>
        <div>Welcome, {user.id}</div>
        <div>Organizations:</div>
        <ul>
          {organizations.map((org) => (
            <li key={org.id}>{org.accountName}</li>
          ))}
        </ul>
      </Suspense>
    </div>
  );
}
