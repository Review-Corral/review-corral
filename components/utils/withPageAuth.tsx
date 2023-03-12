import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SupabaseClient } from "@supabase/auth-helpers-react";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { AddParameters } from "../../services/utils/withApiSupabase";
import { Database } from "../../types/database-types";

export function withPageAuth<
  SchemaName extends string & keyof Database = "public" extends keyof Database
    ? "public"
    : string & keyof Database,
  ResponseType extends Record<string, any> = any,
>({
  authRequired = true,
  getServerSideProps = undefined,
}: {
  authRequired?: boolean;
  getServerSideProps?: AddParameters<
    GetServerSideProps<ResponseType>,
    [SupabaseClient<Database, SchemaName>]
  >;
} = {}): (context: GetServerSidePropsContext) => Promise<any> {
  return async (context: GetServerSidePropsContext) => {
    const supabase = createServerSupabaseClient<Database, SchemaName>(context);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session)
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };

    let ret: any = { props: {} };

    if (getServerSideProps) {
      try {
        ret = await getServerSideProps(context, supabase);
      } catch (error) {
        ret = {
          props: {
            error: String(error),
          },
        };
      }
    }

    return {
      ...ret,
      props: {
        initialSession: session,
        user: session.user,
        ...ret.props,
      },
    };
  };
}
