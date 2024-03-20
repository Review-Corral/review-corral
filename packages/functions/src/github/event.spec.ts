import { handleGithubWebhookEvent } from "@core/github/webhooks";
import { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { beforeEach } from "node:test";
import { describe, expect, it, vi } from "vitest";
import { handler } from "./events";

describe("event.spec", () => {
  beforeEach(() => {
    const mocks = vi.hoisted(() => {
      return {
        handleGithubWebhookEvent: vi.fn(),
      };
    });

    vi.mock("@core/github/webhooks", async () => {
      const actual = await vi.importActual("@core/github/webhooks");
      return {
        ...actual,
        handleGithubWebhookEvent: mocks.handleGithubWebhookEvent,
      };
    });

    vi.mock("@core/github/webhooks/verifyEvent", () => ({
      verifyGithubWebhookSecret: vi.fn(() => true),
    }));
  });

  it("should properly parse HTTP JSON body and pass to event handlers", async () => {
    const eventBody = {
      action: "opened",
      repository: {
        id: 123,
        owner: {
          id: 456,
        },
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

    const handleGithubEventEventMock = handleGithubWebhookEvent;
    expect(handleGithubEventEventMock).toHaveBeenCalledTimes(1);
    expect(handleGithubEventEventMock).toHaveBeenCalledWith({
      event: eventBody,
      eventName: "pull_request",
    });
  });
});
