import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.BASE_FE_URL = "https://example.com";
process.env.BASE_API_URL = "https://api.example.com";
process.env.LOG_LEVEL = "info";

vi.mock("sst", () => ({
  Resource: {
    NEON_DATABASE_URL: { value: "postgresql://test:test@localhost:5432/test" },
    SLACK_SIGNING_SECRET: { value: "test-secret" },
    SLACK_BOT_ID: { value: "B1" },
    SLACK_CLIENT_SECRET: { value: "S1" },
  },
}));

vi.mock("@domain/slack/verifyEvent", () => ({
  verifySlackEventSignature: vi.fn(),
}));

vi.mock("@domain/slack/handlers/reactionEvent", () => ({
  handleSlackReactionEvent: vi.fn(),
}));
vi.mock("@domain/postgres/fetchers/organizations", () => ({
  getOrganization: vi.fn(),
}));
vi.mock("@domain/postgres/fetchers/slack-integrations", () => ({
  getSlackInstallationUsers: vi.fn(),
  getSlackInstallationsForOrganization: vi.fn(),
  deleteSlackIntegration: vi.fn(),
  insertSlackIntegration: vi.fn(),
  updateSlackIntegrationScopes: vi.fn(),
}));
vi.mock("../middleware/auth", () => ({
  authMiddleware: vi.fn(async (_c: any, next: any) => await next()),
  requireAuth: vi.fn(async (_c: any, next: any) => await next()),
}));

import { handleSlackReactionEvent } from "@domain/slack/handlers/reactionEvent";
import { verifySlackEventSignature } from "@domain/slack/verifyEvent";
import { app } from "./routes";

describe("slack /events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifySlackEventSignature).mockReturnValue(true);
  });

  it("returns challenge for url_verification", async () => {
    const response = await app.request("/events", {
      method: "POST",
      headers: {
        "x-slack-signature": "v0=test",
        "x-slack-request-timestamp": String(Math.floor(Date.now() / 1000)),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        type: "url_verification",
        challenge: "abc123",
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ challenge: "abc123" });
  });

  it("dispatches reaction events", async () => {
    const response = await app.request("/events", {
      method: "POST",
      headers: {
        "x-slack-signature": "v0=test",
        "x-slack-request-timestamp": String(Math.floor(Date.now() / 1000)),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        type: "event_callback",
        team_id: "T1",
        event_id: "Ev1",
        event_time: 1,
        event: {
          type: "reaction_added",
          user: "U1",
          reaction: "thumbsup",
          item: {
            type: "message",
            channel: "D1",
            ts: "1.1",
          },
        },
      }),
    });

    expect(response.status).toBe(200);
    expect(handleSlackReactionEvent).toHaveBeenCalledWith({
      eventId: "Ev1",
      event: expect.objectContaining({
        type: "reaction_added",
      }),
    });
  });

  it("returns 401 for invalid signature", async () => {
    vi.mocked(verifySlackEventSignature).mockReturnValue(false);

    const response = await app.request("/events", {
      method: "POST",
      headers: {
        "x-slack-signature": "v0=test",
        "x-slack-request-timestamp": String(Math.floor(Date.now() / 1000)),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        type: "url_verification",
        challenge: "abc123",
      }),
    });

    expect(response.status).toBe(401);
  });
});
