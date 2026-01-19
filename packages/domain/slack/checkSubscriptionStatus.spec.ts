import type { BillingStatus } from "@core/dynamodb/entities/types";
import { describe, expect, it } from "vitest";
import {
  checkSubscriptionStatus,
  getDaysRemainingInGracePeriod,
  isSubscriptionPastDue,
  isWithinGracePeriod,
  shouldSendPaymentWarning,
} from "./checkSubscriptionStatus";

describe("isSubscriptionPastDue", () => {
  it.each([
    ["past_due", true],
    ["active", false],
    ["canceled", false],
    ["trialing", false],
    [null, false],
  ])("should return %s for status '%s'", (status, expected) => {
    expect(isSubscriptionPastDue(status)).toBe(expected);
  });
});

describe("isWithinGracePeriod", () => {
  it("should return true when within 7 days", () => {
    const now = new Date("2024-01-10T12:00:00Z");
    const pastDueStart = "2024-01-05T12:00:00Z"; // 5 days ago
    expect(isWithinGracePeriod(pastDueStart, now)).toBe(true);
  });

  it("should return true on day 6", () => {
    const now = new Date("2024-01-11T12:00:00Z");
    const pastDueStart = "2024-01-05T12:00:00Z"; // 6 days ago
    expect(isWithinGracePeriod(pastDueStart, now)).toBe(true);
  });

  it("should return false when exactly 7 days have passed", () => {
    const now = new Date("2024-01-12T12:00:00Z");
    const pastDueStart = "2024-01-05T12:00:00Z"; // 7 days ago
    expect(isWithinGracePeriod(pastDueStart, now)).toBe(false);
  });

  it("should return false when more than 7 days have passed", () => {
    const now = new Date("2024-01-15T12:00:00Z");
    const pastDueStart = "2024-01-05T12:00:00Z"; // 10 days ago
    expect(isWithinGracePeriod(pastDueStart, now)).toBe(false);
  });
});

describe("getDaysRemainingInGracePeriod", () => {
  it("should return 7 when just started", () => {
    const now = new Date("2024-01-05T12:00:00Z");
    const pastDueStart = "2024-01-05T12:00:00Z";
    expect(getDaysRemainingInGracePeriod(pastDueStart, now)).toBe(7);
  });

  it("should return 2 when 5 days have passed", () => {
    const now = new Date("2024-01-10T12:00:00Z");
    const pastDueStart = "2024-01-05T12:00:00Z";
    expect(getDaysRemainingInGracePeriod(pastDueStart, now)).toBe(2);
  });

  it("should return 0 when grace period expired", () => {
    const now = new Date("2024-01-15T12:00:00Z");
    const pastDueStart = "2024-01-05T12:00:00Z";
    expect(getDaysRemainingInGracePeriod(pastDueStart, now)).toBe(0);
  });
});

describe("shouldSendPaymentWarning", () => {
  it("should return true when no previous warning", () => {
    expect(shouldSendPaymentWarning(undefined)).toBe(true);
  });

  it("should return false when less than 24 hours since last warning", () => {
    const now = new Date("2024-01-05T20:00:00Z");
    const lastWarning = "2024-01-05T12:00:00Z"; // 8 hours ago
    expect(shouldSendPaymentWarning(lastWarning, now)).toBe(false);
  });

  it("should return true when exactly 24 hours since last warning", () => {
    const now = new Date("2024-01-06T12:00:00Z");
    const lastWarning = "2024-01-05T12:00:00Z"; // 24 hours ago
    expect(shouldSendPaymentWarning(lastWarning, now)).toBe(true);
  });

  it("should return true when more than 24 hours since last warning", () => {
    const now = new Date("2024-01-07T12:00:00Z");
    const lastWarning = "2024-01-05T12:00:00Z"; // 48 hours ago
    expect(shouldSendPaymentWarning(lastWarning, now)).toBe(true);
  });
});

describe("checkSubscriptionStatus", () => {
  const now = new Date("2024-01-10T12:00:00Z");

  describe("when subscription is not past_due", () => {
    it("should continue processing with no billing status", () => {
      const result = checkSubscriptionStatus("active", null, now);
      expect(result).toEqual({
        shouldContinueProcessing: true,
        shouldSendWarning: false,
        shouldSendServicePaused: false,
        shouldRecordPastDueStart: false,
        shouldClearBillingStatus: false,
        daysRemainingInGracePeriod: null,
      });
    });

    it("should clear existing billing status", () => {
      const billingStatus: BillingStatus = {
        orgId: 123,
        pastDueStartedAt: "2024-01-05T12:00:00Z",
        expiresAt: 9999999999,
      };
      const result = checkSubscriptionStatus("active", billingStatus, now);
      expect(result.shouldClearBillingStatus).toBe(true);
      expect(result.shouldContinueProcessing).toBe(true);
    });
  });

  describe("when subscription is past_due for the first time", () => {
    it("should record start and send warning", () => {
      const result = checkSubscriptionStatus("past_due", null, now);
      expect(result).toEqual({
        shouldContinueProcessing: true,
        shouldSendWarning: true,
        shouldSendServicePaused: false,
        shouldRecordPastDueStart: true,
        shouldClearBillingStatus: false,
        daysRemainingInGracePeriod: 7,
      });
    });
  });

  describe("when subscription is past_due within grace period", () => {
    it("should send warning if 24h has passed since last warning", () => {
      const billingStatus: BillingStatus = {
        orgId: 123,
        pastDueStartedAt: "2024-01-05T12:00:00Z", // 5 days ago
        lastWarningSentAt: "2024-01-08T12:00:00Z", // 2 days ago
        expiresAt: 9999999999,
      };
      const result = checkSubscriptionStatus("past_due", billingStatus, now);
      expect(result.shouldContinueProcessing).toBe(true);
      expect(result.shouldSendWarning).toBe(true);
      expect(result.shouldRecordPastDueStart).toBe(false);
      expect(result.daysRemainingInGracePeriod).toBe(2);
    });

    it("should not send warning if less than 24h since last warning", () => {
      const billingStatus: BillingStatus = {
        orgId: 123,
        pastDueStartedAt: "2024-01-05T12:00:00Z",
        lastWarningSentAt: "2024-01-10T08:00:00Z", // 4 hours ago
        expiresAt: 9999999999,
      };
      const result = checkSubscriptionStatus("past_due", billingStatus, now);
      expect(result.shouldContinueProcessing).toBe(true);
      expect(result.shouldSendWarning).toBe(false);
    });
  });

  describe("when grace period has expired", () => {
    it("should stop processing and send service paused message", () => {
      const billingStatus: BillingStatus = {
        orgId: 123,
        pastDueStartedAt: "2024-01-01T12:00:00Z", // 9 days ago
        lastWarningSentAt: "2024-01-08T12:00:00Z",
        expiresAt: 9999999999,
      };
      const result = checkSubscriptionStatus("past_due", billingStatus, now);
      expect(result).toEqual({
        shouldContinueProcessing: false,
        shouldSendWarning: false,
        shouldSendServicePaused: true,
        shouldRecordPastDueStart: false,
        shouldClearBillingStatus: false,
        daysRemainingInGracePeriod: 0,
      });
    });

    it("should not send service paused message if already sent", () => {
      const billingStatus: BillingStatus = {
        orgId: 123,
        pastDueStartedAt: "2024-01-01T12:00:00Z",
        lastWarningSentAt: "2024-01-08T12:00:00Z",
        servicePausedSentAt: "2024-01-08T13:00:00Z",
        expiresAt: 9999999999,
      };
      const result = checkSubscriptionStatus("past_due", billingStatus, now);
      expect(result.shouldContinueProcessing).toBe(false);
      expect(result.shouldSendServicePaused).toBe(false);
    });
  });
});
