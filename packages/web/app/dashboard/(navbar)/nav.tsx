import { useOrganizations } from "@/lib/fetchers/organizations";
import { useUser } from "../userActions";
import { Navbar } from "./Navbar";

export default async function Nav() {
  const user = await useUser();
  const organizations = await useOrganizations(user);

  return <Navbar user={user} organizations={organizations} />;
}
