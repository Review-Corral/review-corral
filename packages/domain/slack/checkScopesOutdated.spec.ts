import { type SlackIntegration } from "@domain/postgres/schema";
import { describe, expect, it } from "vitest";
import { mock } from "vitest-mock-extended";
import { shouldWarnAboutScopes } from "./checkScopesOutdated";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

describe("shouldWarnAboutScopes", () => {
  const baseIntegration = {
    id: "test-id",
    orgId: 123,
    slackTeamId: "T123456",
    slackTeamName: "Test Team",
    accessToken: "xoxb-test-token",
    channelId: "C123456",
    channelName: "general",
    scopesUpdatedAt: new Date(),
    scopeHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("should return false when scopes are not empty", () => {
    const integration = mock<SlackIntegration>({
      ...baseIntegration,
      scopes: "chat:write,channels:read",
      lastChecked: null,
    });

    expect(shouldWarnAboutScopes(integration)).toBe(false);
  });

  it("should return false when scopes are empty but checked less than 24 hours ago", () => {
    const recentCheckTime = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago
    const integration = mock<SlackIntegration>({
      ...baseIntegration,
      scopes: "",
      lastChecked: recentCheckTime,
    });

    expect(shouldWarnAboutScopes(integration)).toBe(false);
  });

  it("should return true when scopes are empty and lastChecked is null", () => {
    const integration = mock<SlackIntegration>({
      ...baseIntegration,
      scopes: "",
      lastChecked: null,
    });

    expect(shouldWarnAboutScopes(integration)).toBe(true);
  });

  it("should return true when scopes are empty and checked more than 24 hours ago", () => {
    const oldCheckTime = new Date(Date.now() - TWENTY_FOUR_HOURS_MS - 1000); // 24 hours + 1 second ago
    const integration = mock<SlackIntegration>({
      ...baseIntegration,
      scopes: "",
      lastChecked: oldCheckTime,
    });

    expect(shouldWarnAboutScopes(integration)).toBe(true);
  });
});
