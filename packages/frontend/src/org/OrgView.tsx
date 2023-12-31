import { FC } from "react";
import { useParams } from "react-router-dom";

interface OrgViewProps {}

export const OrgView: FC<OrgViewProps> = () => {
  const { orgId } = useParams();
  return <div>This is the org view for orgId: {orgId}</div>;
};
