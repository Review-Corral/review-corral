import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { InstallationsResponse } from "../../github-types";

export const USE_INSTALLATIONS_QUERY = "getInstallations";

export const useInstallations = (isEnabled: boolean = true) => {
  return useQuery<InstallationsResponse, AxiosError>(
    ["getInstallations"],
    async () => {
      return (await axios.get<InstallationsResponse>("/api/gh/installations"))
        .data;
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 10, // 10 minutes
      cacheTime: 1000 * 60 * 60, // 60 minutes
      refetchOnMount: false,
      enabled: isEnabled,
    },
  );
};

// 30520308
