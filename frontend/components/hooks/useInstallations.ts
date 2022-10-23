import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { InstallationsResponse } from "../../github-types";

export const USE_INSTALLATIONS_QUERY = "getInstallations";

export const useInstallations = () => {
  return useQuery<InstallationsResponse, AxiosError>(
    [USE_INSTALLATIONS_QUERY],
    async () => {
      return (await axios.get<InstallationsResponse>("/api/gh/installations"))
        .data;
    },
  );
};
