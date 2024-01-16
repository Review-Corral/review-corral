import { useOrganizations } from "@/lib/fetchers/organizations";
import * as z from "zod";
import { Navbar } from "./(navbar)/Navbar";
import { useUser } from "./userActions";

const pathSchema = z.object({
  orgId: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Number(val);
    }),
});

export default async function Nav(params: { orgId?: string }) {
  const user = await useUser();
  const organizations = await useOrganizations(user);

  const path = pathSchema.parse(params);

  return (
    <Navbar
      user={user}
      organizations={organizations}
      activeOrganizationAccountId={path.orgId}
    />
  );
}
