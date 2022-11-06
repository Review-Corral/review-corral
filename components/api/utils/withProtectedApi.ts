// pages/api/protected-route.ts
import {
  createServerSupabaseClient,
  SupabaseClient,
} from "@supabase/auth-helpers-nextjs";
import { NextApiResponse } from "next";
import { AxiomAPIRequest } from "next-axiom/dist/withAxiom";
import { Database } from "../../../database-types";

export function withProtectedApi<T = any>(
  handler: (
    req: AxiomAPIRequest,
    res: NextApiResponse,
    supabaseClient: SupabaseClient<Database>,
  ) => Promise<void | NextApiResponse>,
) {
  return async (req: AxiomAPIRequest, res: NextApiResponse): Promise<void> => {
    // Create authenticated Supabase Client
    const supabase = createServerSupabaseClient({ req, res });
    // Check if we have a session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session)
      return res.status(401).json({
        error: "not_authenticated",
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
