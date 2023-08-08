"use client";

import { Organization } from "@/components/organization/shared";
import {
  GET_SLACK_INTEGRATIONS_KEY,
  useSlackIntegrations,
} from "@/components/organization/slack/useSlackIntegrations";
import LoadingView from "@/components/views/LoadingView";
import { useQueryClient } from "@tanstack/react-query";
import type { NextPage } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const PostSlackAuth: NextPage<{ organization: Organization }> = ({
  organization,
}) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const slackIntegration = useSlackIntegrations({
    organizationId: organization.id,
  });

  const [setRefetch, setSetRefetch] = useState<boolean>(false);

  useEffect(() => {
    queryClient.refetchQueries([GET_SLACK_INTEGRATIONS_KEY]);
    setSetRefetch(true);
  }, []);

  useEffect(() => {
    if (setRefetch && !slackIntegration.isLoading) {
      router.push("/org/" + organization.account_id);
    }
  }, [setRefetch, slackIntegration.isLoading]);

  return <LoadingView loadingText="Loading Slack Integration" />;
};
