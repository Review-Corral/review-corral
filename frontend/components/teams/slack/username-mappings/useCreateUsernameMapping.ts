import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { UsernameMapping } from "./useGetUsernameMappings";

export const USE_CREATE_USERNAME_MAPPING_KEY = "postUsernameMapping";
export const USE_UPDATE_USERNAME_MAPPING_KEY = "updateUsernameMapping";
export const USE_DELETE_USERNAME_MAPPING_KEY = "deleteUsernameMapping";

export const useCreateUsernameMapping = (teamId: string) => {
  return useMutation<void, AxiosError, UsernameMapping>(
    [USE_CREATE_USERNAME_MAPPING_KEY, teamId],
    async (data) => {
      await axios.post(`/api/proxy/teams/username-mappings`, data);
    },
  );
};

export const useUpdateUsernameMapping = (teamId: string) => {
  return useMutation<void, AxiosError, UsernameMapping>(
    [USE_UPDATE_USERNAME_MAPPING_KEY, teamId],
    async (data) => {
      await axios.put(`/api/proxy/teams/username-mappings`, data);
    },
  );
};

export const useDeleteUsernameMapping = (teamId: string) => {
  return useMutation<void, AxiosError, UsernameMapping>(
    [USE_DELETE_USERNAME_MAPPING_KEY, teamId],
    async (data) => {
      await axios.put(`/api/proxy/teams/username-mappings`, data);
    },
  );
};
