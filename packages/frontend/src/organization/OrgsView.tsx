import { Organization } from "@core/dynamodb/entities/types";
import Cookies from "js-cookie";
import ky from "ky";
import { FC } from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { auth_access_token_key } from "../auth/const";

interface OrgsViewProps {}

export const OrgsView: FC<OrgsViewProps> = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["installations"],
    queryFn: async () => {
      return await ky
        .get(`${import.meta.env.VITE_API_URL}/installations`, {
          headers: {
            Authorization: `Bearer ${Cookies.get(auth_access_token_key)}`,
          },
        })
        .json<Organization[]>();
    },
  });
  return (
    <>
      <div className="text-xl">Installations</div>;
      <div>Loading: {isLoading ? "true" : "false"}</div>
      <ul>
        {data?.map((installation) => (
          <li key={installation.orgId}>
            <Link to={`/org/${installation.installationId}`}>{installation.name}</Link>
          </li>
        ))}
      </ul>
    </>
  );
};
