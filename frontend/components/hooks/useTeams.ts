import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

export type Team = {
  created_at: Date | null;
  id: string;
  name: string | null;
};

export const useTeams = () => {
  return useQuery<Team[], AxiosError>(["getTeams"], async () => {
    return (await axios.get("/api/proxy/teams")).data;
  });
};
