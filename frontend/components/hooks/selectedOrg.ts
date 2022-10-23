import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface SetSelectedStateArgs {
  state: string;
}

const queryKey = ["org", "selected"];

export const storageKey = "selectedOrg";

export function useSetSelectedOrg() {
  const queryClient = useQueryClient();
  return useMutation<string, Error, SetSelectedStateArgs>(
    async ({ state: org }) => {
      window.localStorage.setItem(storageKey, org);
      return org;
    },
    {
      onSuccess() {
        queryClient.refetchQueries(queryKey);
      },
    },
  );
}

export function useGetSelectedOrg() {
  return useQuery<string | undefined>(queryKey, () => {
    return window.localStorage.getItem(storageKey) || undefined;
  });
}
