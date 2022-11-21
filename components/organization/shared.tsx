import { FC, PropsWithChildren } from "react";
import { Organization, Pages } from "../../pages/org/[accountId]/[[...page]]";

export interface OrgViewProps {
  organization: Organization;
  setPage: (page: Pages) => void;
}

export const Header: FC<PropsWithChildren> = ({ children }) => (
  <h1 className="text-2xl font-bold pt-8">{children}</h1>
);
