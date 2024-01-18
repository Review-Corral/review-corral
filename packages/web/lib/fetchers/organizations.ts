"use server";

import { fetchUser } from "@/app/dashboard/userActions";
import { Organization, Repository } from "@core/db/types";
import { cFetch } from "./shared";

export const useOrganizations = async () =>
  await cFetch<Organization[]>(`/gh/installations`, {
    user: await fetchUser(),
  });

export const useOrganization = async (orgId: number) => {
  // TODO: should probably add a method to fetch a single repo from the DB
  const organizations = await useOrganizations();
  const organization = organizations.find((org) => org.id === orgId);

  if (!organization) {
    throw new Error(`Organization ${orgId} not found`);
  }

  return organization;
};

export const useRepositories = async (orgId: number) =>
  await cFetch<Repository[]>(`/gh/installations/${orgId}/repositories`, {
    user: await fetchUser(),
  });

export const useSlackRepositories = async (orgId: number) =>
  await cFetch<Repository[]>(`/slack/${orgId}/installations`, {
    user: await fetchUser(),
  });

export const setActiveRepo = async (repoId: number, isActive: boolean) =>
  await cFetch(`/gh/repositories/${repoId}`, {
    body: JSON.stringify({ isActive }),
    user: await fetchUser(),
    method: "PUT",
  });
