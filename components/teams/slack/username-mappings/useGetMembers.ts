import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

export const USE_GET_MEMBERS_KEY = "useGetUsernameMappings";

export interface OrgMember {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
}

export const useGetMembers = () => {
  return useQuery<OrgMember[] | undefined, AxiosError>(
    [USE_GET_MEMBERS_KEY],
    async () => {
      return (
        await axios.get<OrgMember[] | undefined>(`/api/proxy/github/members`)
      ).data;
    },
  );
};
