import {
  createServerSupabaseClient,
  SupabaseClient,
} from "@supabase/auth-helpers-nextjs";
import { CookieOptions } from "@supabase/auth-helpers-shared";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { Database } from "../../../database-types";

export type AddParameters<
  TFunction extends (...args: any) => any,
  TParameters extends [...args: any],
> = (
  ...args: [...Parameters<TFunction>, ...TParameters]
) => ReturnType<TFunction>;

export default function withApiSupabase<ResponseType = any>(
  handler: AddParameters<
    NextApiHandler<ResponseType>,
    [SupabaseClient<Database, "public">]
  >,
  options: { cookieOptions?: CookieOptions } = {},
) {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables are required!",
      );
    }

    const supabase = createServerSupabaseClient<Database, "public">({
      req,
      res,
    });

    try {
      await handler(req, res, supabase);
    } catch (error) {
      res.status(500).json({
        error: String(error),
      });
      return;
    }
  };
}
