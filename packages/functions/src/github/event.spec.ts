import { beforeEach } from "node:test";
import { handleGithubWebhookEvent } from "@domain/github/webhooks";
import { APIGatewayProxyEvent, APIGatewayProxyEventV2, Context } from "aws-lambda";
import { describe, expect, it, vi } from "vitest";
import { handler } from "./events";

vi.mock("sst/node/table", () => ({
  Table: {
    main: {
      tableName: "mock-table-name",
    },
  },
}));

describe("event.spec", () => {
  beforeEach(() => {
    vi.stubEnv("GH_WEBHOOK_SECRET", "test-secret");
    const mocks = vi.hoisted(() => {
      return {
        handleGithubWebhookEvent: vi.fn(),
      };
    });

    vi.mock("@domain/github/webhooks", async () => {
      const actual = await vi.importActual("@domain/github/webhooks");
      return {
        ...actual,
        handleGithubWebhookEvent: mocks.handleGithubWebhookEvent,
      };
    });

    vi.mock("@domain/github/webhooks/verifyEvent", () => ({
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
          "x-hub-signature-256":
            "sha256=b68844bb46a27548f37cede3c726a13bf677a081a4a10ff37cc6acbe89e7d6f3",
        },
        body: JSON.stringify(eventBody),
      } as any as APIGatewayProxyEvent,
      {} as any as Context,
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
