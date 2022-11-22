import { useQueryClient } from "@tanstack/react-query";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  GET_SLACK_INTEGRATIONS_KEY,
  useSlackIntegrations,
} from "../../../components/organization/slack/useSlackIntegrations";
import { flattenParam } from "../../../components/utils/flattenParam";
import { withPageAuth } from "../../../components/utils/withPageAuth";
import LoadingView from "../../../components/views/LoadingView";
import { Organization } from "./[[...page]]";

const PostSlackAuth: NextPage<{ organization: Organization }> = ({
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

export const getServerSideProps = withPageAuth<"public">({
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
