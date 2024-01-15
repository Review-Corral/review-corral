import { useOrganizations } from "@/lib/fetchers/organizations";
import { useUser } from "./userActions";

export default async function DashboardHome() {
  const user = await useUser();

  const organizations = await useOrganizations(user);

  return (
    <div className="h-full w-full">
      <div>Welcome, {user.id}</div>
      <div>Organizations:</div>
      <ul>
        {organizations.map((org) => (
          <li key={org.id}>{org.accountName}</li>
        ))}
      </ul>
    </div>
  );
}
