import { APIGatewayEvent } from "aws-lambda";
import { Context } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { verifyGithubWebhookEvent } from "./handleWebhook";

// Mock SST resources
vi.mock("sst", () => ({
  Resource: {
    GH_WEBHOOK_SECRET: {
      value: "test-secret",
    },
  },
}));

// Mock verifyGithubWebhookSecret
vi.mock("@domain/github/webhooks/verifyEvent", () => ({
  verifyGithubWebhookSecret: vi.fn().mockResolvedValue(true),
}));

// Mock githubWebhookBodySchema and handleGithubWebhookEvent
vi.mock("@domain/github/webhooks", () => ({
  githubWebhookBodySchema: {
    safeParse: vi.fn(() => ({ success: true, data: {} })),
  },
  handleGithubWebhookEvent: vi.fn().mockResolvedValue(undefined),
}));

describe("handleGithubWebhookEvent", () => {
  // Define a mock Hono context
  let mockContext: Partial<Context>;
  let mockJsonResponse: any;
  let mockJson: any;
  let mockHeader: any;
  let mockReqJson: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock for JSON response
    mockJsonResponse = { message: "Success" };
    mockJson = vi.fn().mockReturnValue(mockJsonResponse);
    mockHeader = vi.fn().mockReturnValue("sha256=test-signature");
    mockReqJson = vi.fn().mockResolvedValue({ test: "data" });

    // Create a mock Hono context
    mockContext = {
      env: {
        event: {
          headers: {
            "x-github-delivery": "123",
            "x-github-event": "pull_request",
            "x-hub-signature-256": "sha256=test-signature",
          },
          body: JSON.stringify({
            action: "opened",
            repository: { id: 123, owner: { id: 456 } },
          }),
        } as unknown as APIGatewayEvent,
      },
      req: {
        header: mockHeader,
        json: mockReqJson,
        method: "POST",
      },
      json: mockJson,
    } as unknown as Context;
  });

  it("should successfully handle a valid webhook event", async () => {
    // Call the handler with our mock context
    await verifyGithubWebhookEvent(mockContext as Context, {} as any);

    // Verify that the header function was called with the expected parameter
    expect(mockHeader).toHaveBeenCalledWith("x-hub-signature-256");

    // Verify the JSON response was called with success message and 200 status code
    expect(mockJson).toHaveBeenCalledWith({ message: "Success" }, 200);
  });

  it("should return 401 when signature verification fails", async () => {
    // Override the mock to return false for this test
    const verifyMock = await import("@domain/github/webhooks/verifyEvent");
    (verifyMock.verifyGithubWebhookSecret as any).mockResolvedValueOnce(false);

    // Call the handler
    await verifyGithubWebhookEvent(mockContext as Context, {} as any);

    // Verify it returns an Unauthorized response
    expect(mockJson).toHaveBeenCalledWith({ message: "Unauthorized" }, 401);
  });

  it("should return 401 when signature header is missing", async () => {
    // Override the mock to return null for this test
    mockHeader.mockReturnValueOnce(null);

    // Call the handler
    await verifyGithubWebhookEvent(mockContext as Context, {} as any);

    // Verify it returns an Unauthorized response
    expect(mockJson).toHaveBeenCalledWith({ message: "Unauthorized" }, 401);
  });

  it("should handle invalid event structure", async () => {
    // Override the mock for githubWebhookBodySchema.safeParse
    const webhooksMock = await import("@domain/github/webhooks");
    (webhooksMock.githubWebhookBodySchema.safeParse as any).mockReturnValueOnce({
      success: false,
      error: new Error("Invalid schema"),
    });

    // Call the handler
    await verifyGithubWebhookEvent(mockContext as Context, {} as any);

    // Verify it returns a Bad Request response
    expect(mockJson).toHaveBeenCalledWith({ message: "Invalid event body" }, 400);
  });
});
