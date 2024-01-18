import { useOrganizations } from "@/lib/fetchers/organizations";
import { fetchUser } from "../userActions";
import { Navbar } from "./Navbar";

export default async function Nav() {
  const user = await fetchUser();
  const organizations = await useOrganizations(user);

  return <Navbar user={user} organizations={organizations} />;
}
