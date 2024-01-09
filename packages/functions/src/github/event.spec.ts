import { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { describe, expect, it, vi } from "vitest";
import { handler } from "./events";

describe("event.spec", () => {
  it("should test something", async () => {
    vi.mock("../../../core/github/webhooks", async () => {
      const actual = await vi.importActual("../../../core/github/webhooks");
      return {
        ...actual,
        handleGithubWebhookEvent: vi.fn(),
      };
    });

    vi.mock("../../../core/github/webhooks/verifyEvent", () => ({
      verifyGithubWebhookSecret: vi.fn(() => true),
    }));

    const eventBody = {
      action: "opened",
      repository: {
        id: 123,
      },
    };

    const result = await handler(
      {
        headers: {
          "x-github-delivery": "123",
          "x-github-event": "pull_request",
          "x-hub-signature-256": "sha256=123",
        },
        body: JSON.stringify(eventBody),
      } as any as APIGatewayProxyEventV2,
      {} as any as Context
    );

    expect(result).toMatchObject({
      headers: {},
      cookies: [],
      statusCode: 200,
      body: '{"message":"Success"}',
    });
  });
});
