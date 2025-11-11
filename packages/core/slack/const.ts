export const LATEST_SLACK_SCOPES =
  "channels:join,chat:write,chat:write.public,im:write,users:read,commands,channels:history";

// For some reason, Slack will give us these instead of the above which we put in the request
const expectedScopes = [
  "chat:write",
  "channels:history",
  // "groups:history", This comes back for some reason even though we don't request it
  "commands",
  "users:read",
  "chat:write.public",
  "channels:join",
  "im:write",
];

/**
 * Checks if we have the required scopes installed
 */
export const haveRequiredScopes = (scopes: string): boolean => {
  const split = scopes.split(",");
  return expectedScopes.every((scope) => split.includes(scope));
};
