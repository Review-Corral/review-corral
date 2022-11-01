import { withPageAuth } from "@supabase/auth-helpers-nextjs";
import { useQueryClient } from "@tanstack/react-query";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Organization } from ".";
import {
  GET_SLACK_INTEGRATIONS_KEY,
  useSlackIntegrations,
} from "../../../components/teams/slack/useSlackIntegrations";
import { flattenParam } from "../../../components/utils/flattenParam";
import LoadingView from "../../../components/views/LoadingView";
import { Database } from "../../../database-types";

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

export default PostSlackAuth;

export const getServerSideProps = withPageAuth<Database, "public">({
  redirectTo: "/login",
  async getServerSideProps(ctx, supabaseClient) {
    console.log("In get server side props");
    const accountId = flattenParam(ctx.params?.["accountId"]);

    if (!accountId) {
      return {
        notFound: true,
      };
    }

    const { data, error } = await supabaseClient
      .from("organizations")
      .select("*")
      .eq("account_id", accountId)
      .limit(1)
      .single();

    if (error) {
      console.info(
        "Got error getting organization by account ID ",
        accountId,
        ": ",
        error,
      );
      return {
        notFound: true,
      };
    }

    return { props: { organization: data } };
  },
});
