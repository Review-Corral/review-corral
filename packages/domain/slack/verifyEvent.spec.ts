import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifySlackEventSignature } from "./verifyEvent";

describe("verifySlackEventSignature", () => {
  it("returns true for valid signature within tolerance", () => {
    const rawBody = JSON.stringify({ hello: "world" });
    const timestamp = "1700000000";
    const signingSecret = "test-secret";
    const base = `v0:${timestamp}:${rawBody}`;
    const signature = `v0=${createHmac("sha256", signingSecret).update(base).digest("hex")}`;

    const result = verifySlackEventSignature({
      rawBody,
      timestamp,
      signature,
      signingSecret,
      nowSeconds: 1700000000,
    });

    expect(result).toBe(true);
  });

  it("returns false for invalid signature", () => {
    const result = verifySlackEventSignature({
      rawBody: "{}",
      timestamp: "1700000000",
      signature: "v0=bad",
      signingSecret: "test-secret",
      nowSeconds: 1700000000,
    });

    expect(result).toBe(false);
  });

  it("returns false for stale timestamp", () => {
    const rawBody = "{}";
    const timestamp = "1700000000";
    const signingSecret = "test-secret";
    const base = `v0:${timestamp}:${rawBody}`;
    const signature = `v0=${createHmac("sha256", signingSecret).update(base).digest("hex")}`;

    const result = verifySlackEventSignature({
      rawBody,
      timestamp,
      signature,
      signingSecret,
      nowSeconds: 1700000501,
      toleranceSeconds: 300,
    });

    expect(result).toBe(false);
  });
});
