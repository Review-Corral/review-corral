import { useUser } from "./actions";

export default async function DashboardHome() {
  const user = await useUser();

  return <div className="h-full w-full">Welcome, {user.id}</div>;
}
