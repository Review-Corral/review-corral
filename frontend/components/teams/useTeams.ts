import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

export type Team = {
  created_at: Date | null;
  id: string;
  name: string | null;
};

export const USE_TEAMS_QUERY_KEY = "getTeams";

export const useTeams = () => {
  return useQuery<Team[], AxiosError>([USE_TEAMS_QUERY_KEY], async () => {
    return (await axios.get<Team[]>("/api/proxy/teams")).data;
  });
};
