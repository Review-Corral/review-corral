import Cookies from "js-cookie";
import ky from "ky";
import { useQuery } from "react-query";
import { auth_access_token_key } from "../auth/const";

export const OldHomeView: React.FC = () => {
  return (
    <>
      <div className="text-xl">Home</div>
      <div className="flex flex-col">
        <ProfileView />
        <InstallationsView />
      </div>
    </>
  );
};

export const ProfileView: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      return await ky
        .get(`${import.meta.env.VITE_API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${Cookies.get(auth_access_token_key)}`,
          },
        })
        .json();
    },
  });
  return (
    <>
      <div className="text-xl">Profile</div>;
      <div>Loading: {isLoading ? "true" : "false"}</div>
      <div>Data: {JSON.stringify(data, null, 2)}</div>
    </>
  );
};

export const InstallationsView: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["installations"],
    queryFn: async () => {
      return await ky
        .get(`${import.meta.env.VITE_API_URL}/installations`, {
          headers: {
            Authorization: `Bearer ${Cookies.get(auth_access_token_key)}`,
          },
        })
        .json();
    },
  });
  return (
    <>
      <div className="text-xl">Installations</div>;
      <div>Loading: {isLoading ? "true" : "false"}</div>
      <div>Data: {JSON.stringify(data, null, 2)}</div>
    </>
  );
};
