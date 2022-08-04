import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useTeams = () => {
  return useQuery(["getTeams"], async () => {
    return (await axios.get("/api/proxy/teams")).data;
  });
};
