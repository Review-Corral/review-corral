"use server";

import { fetchUser } from "@/app/dashboard/userActions";
import {
  Organization,
  Repository,
  SlackIntegration,
  UsernameMapping,
} from "@core/db/types";
import { revalidateTag } from "next/cache";
import { cFetch } from "./shared";

const fetchReposTags = "repos";
const fetchUsernamesTags = "usernames";

export const fetchOrganizations = async () =>
  await cFetch<Organization[]>(`/gh/installations`, {
    user: await fetchUser(),
  });

export const fetchOrganization = async (orgId: number) => {
  // TODO: should probably add a method to fetch a single repo from the DB
  const organizations = await fetchOrganizations();
  const organization = organizations.find((org) => org.id === orgId);

  if (!organization) {
    throw new Error(`Organization ${orgId} not found`);
  }

  return organization;
};

export const fetchRepositories = async (orgId: number) =>
  await cFetch<Repository[]>(`/gh/installations/${orgId}/repositories`, {
    user: await fetchUser(),
    tags: [fetchReposTags],
  });

export const fetchUsernameMappings = async (orgId: number) =>
  await cFetch<UsernameMapping[]>(`/${orgId}/usernames`, {
    user: await fetchUser(),
    tags: [fetchUsernamesTags],
  });

export const fetchSlackIntegrations = async (orgId: number) =>
  await cFetch<SlackIntegration[]>(`/slack/${orgId}/installations`, {
    user: await fetchUser(),
  });

export const setActiveRepo = async (repoId: number, isActive: boolean) => {
  const result = await cFetch(`/gh/repositories/${repoId}`, {
    body: JSON.stringify({ isActive }),
    user: await fetchUser(),
    method: "PUT",
  });
  revalidateTag(fetchReposTags);
  return result;
};
