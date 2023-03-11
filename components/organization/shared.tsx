import { FC, PropsWithChildren } from "react";
import { Database } from "../../types/database-types";

export type Pages = "github" | "slack" | "usernames";

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];

export interface OrgViewProps {
  organization: Organization;
  setPage: (page: Pages) => void;
}

export const Header: FC<PropsWithChildren> = ({ children }) => (
  <h1 className="text-2xl font-bold pt-8">{children}</h1>
);
