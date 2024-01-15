import { useOrganizations } from "@/lib/fetchers/organizations";
import { Navbar } from "./Navbar";
import { useUser } from "./dashboard/userActions";

export default async function Nav() {
  const user = await useUser();
  const organizations = await useOrganizations(user);
  return <Navbar user={user} organizations={organizations} />;
}
