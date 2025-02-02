import { assertVarExists } from "../utils/assert";

/**
 * Builds the Slack auth URL
 */
export const getSlackAuthUrl = () => {
  return `${assertVarExists("NEXT_PUBLIC_API_URL")}/slack/oauth`;
};
