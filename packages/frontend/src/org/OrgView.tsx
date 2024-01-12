import Cookies from "js-cookie";
import ky from "ky";
import { FC } from "react";
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import { auth_access_token_key } from "../auth/const";

interface OrgViewProps {}

export const OrgView: FC<OrgViewProps> = () => {
  const { orgId } = useParams();

  const { isLoading } = useQuery({
    queryKey: ["respositories", orgId],
    queryFn: async () => {
      return await ky
        .get(
          `${import.meta.env.VITE_API_URL}/installations/${orgId}/repositories`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get(auth_access_token_key)}`,
            },
          }
        )
        .json();
    },
  });
  return (
    <>
      <div className="text-xl">Repositories</div>;
      <div>This is the org view for orgId: {orgId}</div>
      <div>Loading: {isLoading ? "true" : "false"}</div>
    </>
  );
};
