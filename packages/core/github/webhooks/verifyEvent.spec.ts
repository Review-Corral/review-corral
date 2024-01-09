import { expect, test } from "vitest";
import { caculateSignature } from "./verifyEvent";

test("should calculate correct signature", async () => {
  const calculated = await caculateSignature({
    eventBody: "Hello, World!",
    secret: "It's a Secret to Everybody",
  });

  expect(calculated).toBe(
    "sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17"
  );
});
