import { createHmac, timingSafeEqual } from "node:crypto";

export const verifyGithubWebhookSecret = async ({
  signature,
  ...args
}: {
  eventBody: any; // JSON string of event body
  signature: string;
  secret: string;
}) => {
  const calculated = await caculateSignature(args);

  return timingSafeEqual(Buffer.from(calculated), Buffer.from(signature));
};

const caculateSignature = async ({
  eventBody,
  secret,
}: {
  eventBody: string; // JSON string of event body
  secret: string;
}) => {
  const hmac = createHmac("sha256", secret);
  hmac.update(eventBody);
  return `sha256=${hmac.digest("hex")}`;
};
