import { NextApiHandler } from "next";
import httpProxyMiddleware from "next-http-proxy-middleware";
import { getAccessTokenSafe } from "../../../lib/supabase/getAccessTokenSafe";

const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:8080";
const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

function prepareAppBaseUrl(appBaseUrl: string): string {
  if (/^https?:\/\//.test(appBaseUrl)) return appBaseUrl;

  return `https://${appBaseUrl}`;
}

const handleApiRequest: NextApiHandler = async (req, res) => {
  const accessToken = getAccessTokenSafe();
  const hasUserSession = !req.headers.authorization && !!accessToken;

  return httpProxyMiddleware(req, res, {
    target: apiBaseUrl,
    pathRewrite: [{ patternStr: "^/api/proxy", replaceStr: "" }],
    ...(hasUserSession && {
      headers: {
        "App-Base-Url": prepareAppBaseUrl(appBaseUrl),
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  });
};

export default handleApiRequest;

// Explicit flag to tell Next.js that we're using an external resolver for our
// routes to avoid the 'API resolved without sending a response' warning
// See https://github.com/vercel/next.js/pull/11380
export const config = {
  api: {
    externalResolver: true,
  },
};
