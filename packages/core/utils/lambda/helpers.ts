import { execSync } from "child_process";
import { z } from "zod";
import { LambdaEvent, isApiGatewayProxyEvent } from "./types";

const UNKNOWN_RESULT_TEXT = "UNKOWN";

const authClaimsSchema = z.object({
  sub: z.string(),
  email: z.string(),
  "custom:isStaff": z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

export type AuthClaims = z.infer<typeof authClaimsSchema>;

export const getAuthClaims = (event: LambdaEvent): AuthClaims | undefined => {
  if (!isApiGatewayProxyEvent(event)) return undefined;
  try {
    const claims = event.requestContext.authorizer?.jwt?.claims || {};
    return authClaimsSchema.parse(claims);
  } catch (err) {
    return undefined;
  }
};

export const getIsLocal = (): boolean => {
  const isLocalString = process.env.IS_LOCAL;

  if (!isLocalString) return false;

  return /true/i.test(isLocalString);
};

export const getDebugMode = (): boolean => {
  return !!(process.env.DEBUG_MODE || process.env.IS_LOCAL);
};

export const getFrontendUrl = (): string | undefined => {
  const baseUrl = process.env.BASE_FE_URL;
  if (!baseUrl) {
    // Purposefully not using Logger since it'll create a cyclical dependency
    console.error("BASE_FE_URL environment variable not defined");
  }
  return baseUrl;
};

export const getReleaseVersion = (): string => {
  return (
    process.env.SENTRY_RELEASE ??
    (!!getIsLocal() ? getCurrentCommitSha() : "UNKNOWN")
  );
};

/**
 * Retrieve the environment and friendly name from environment variables. Fall back
 * to parsing the function name if the environment variables are not set.
 */
export const getFriendlyNameAndEnvironment = (
  name: string | undefined = process.env.AWS_LAMBDA_FUNCTION_NAME
) => {
  const matches = (name ?? "").match(/(\w+)-\w+-\w+-\w+-(\w+?)[A-Z0-9]*-\w+/);
  const matchResults =
    matches && matches.length === 3
      ? { environment: matches[1], friendlyName: matches[2] }
      : {};

  const environment =
    process.env.SENTRY_ENVIRONMENT ?? matchResults.environment ?? "UNKNOWN";
  const friendlyName =
    process.env.FRIENDLY_NAME ?? matchResults.friendlyName ?? "UNKNOWN";

  if (environment === "UNKNOWN" || friendlyName === "UNKNOWN") {
    // Cannot use Logger here because it'll create a cyclical dependency
    console.warn(`Unable to parse function environment/name: ${name}`);
  }

  return { environment, friendlyName };
};

export function getCurrentCommitSha(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch (error) {
    console.error("Error getting commit SHA:", error);
    return UNKNOWN_RESULT_TEXT;
  }
}

/**
 * Get the current Git branch name.
 * @returns {string} The current Git branch name.
 */
export const getCurrentBranchName = (): string => {
  try {
    const branchName = execSync("git symbolic-ref --short HEAD")
      .toString()
      .trim();
    return branchName;
  } catch (error) {
    console.error("Couldn't get current branch name:", error);
    return UNKNOWN_RESULT_TEXT;
  }
};
