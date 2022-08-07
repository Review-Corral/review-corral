import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { Team, USE_TEAMS_QUERY_KEY } from "./useTeams";

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation<Team, AxiosError, { name: string }>(
    ["createTeam"],
    async ({ name }) => axios.post("/api/proxy/teams", { name }),
    {
      onSuccess: () => queryClient.refetchQueries([USE_TEAMS_QUERY_KEY]),
    },
  );
};
