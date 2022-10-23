import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { Installation } from "../../github-types";

export const USE_INSTALLATIONS_QUERY = "getInstallations";

export const useInstallations = () => {
  return useQuery<Installation[], AxiosError>(
    [USE_INSTALLATIONS_QUERY],
    async () => {
      return (await axios.get<Installation[]>("/api/gh/installations")).data;
    },
  );
};
