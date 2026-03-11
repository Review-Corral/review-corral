import { createHmac, timingSafeEqual } from "node:crypto";

export function verifySlackEventSignature({
  rawBody,
  timestamp,
  signature,
  signingSecret,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 60 * 5,
}: {
  rawBody: string;
  timestamp: string;
  signature: string;
  signingSecret: string;
  nowSeconds?: number;
  toleranceSeconds?: number;
}): boolean {
  const timestampNum = Number(timestamp);
  if (!Number.isFinite(timestampNum)) {
    return false;
  }

  if (Math.abs(nowSeconds - timestampNum) > toleranceSeconds) {
    return false;
  }

  const baseString = `v0:${timestamp}:${rawBody}`;
  const hmac = createHmac("sha256", signingSecret);
  hmac.update(baseString);
  const calculated = `v0=${hmac.digest("hex")}`;

  try {
    return timingSafeEqual(Buffer.from(calculated), Buffer.from(signature));
  } catch {
    return false;
  }
}
