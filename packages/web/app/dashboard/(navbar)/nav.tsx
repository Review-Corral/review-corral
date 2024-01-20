import { fetchOrganizations } from "@/lib/fetchers/organizations";
import { fetchUser } from "../userActions";
import { Navbar } from "./Navbar";

export default async function Nav() {
  const user = await fetchUser();
  const organizations = await fetchOrganizations();

  return <Navbar user={user} organizations={organizations} />;
}
