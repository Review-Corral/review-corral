import { expect, test } from "vitest";
import { verifyGithubWebhookSecret } from "./verifyEvent";

test("should verify correct signature", async () => {
  const calculated = await verifyGithubWebhookSecret({
    eventBody: "Hello, World!",
    secret: "It's a Secret to Everybody",
    signature:
      "sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17",
  });

  expect(calculated).toBe(true);
});
