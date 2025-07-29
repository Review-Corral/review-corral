import { describe, expect, it } from "vitest";
import { aggregateCheckStatus } from "./checkStatus";
import { PullRequestCheckRunsResponse } from "./endpointTypes";

describe("aggregateCheckStatus", () => {
  it("should handle empty check runs", () => {
    const checkRuns: PullRequestCheckRunsResponse = {
      total_count: 0,
      check_runs: [],
    };

    const result = aggregateCheckStatus(checkRuns);

    expect(result).toEqual({
      total: 0,
      pending: 0,
      success: 0,
      failure: 0,
    });
  });

  it("should count queued checks as pending", () => {
    const checkRuns: PullRequestCheckRunsResponse = {
      total_count: 2,
      check_runs: [
        {
          id: 1,
          status: "queued",
          conclusion: null,
        },
        {
          id: 2,
          status: "queued",
          conclusion: null,
        },
      ] as any,
    };

    const result = aggregateCheckStatus(checkRuns);

    expect(result).toEqual({
      total: 2,
      pending: 2,
      success: 0,
      failure: 0,
    });
  });

  it("should count in_progress checks as pending", () => {
    const checkRuns: PullRequestCheckRunsResponse = {
      total_count: 1,
      check_runs: [
        {
          id: 1,
          status: "in_progress",
          conclusion: null,
        },
      ] as any,
    };

    const result = aggregateCheckStatus(checkRuns);

    expect(result).toEqual({
      total: 1,
      pending: 1,
      success: 0,
      failure: 0,
    });
  });

  it("should count completed successful checks as success", () => {
    const checkRuns: PullRequestCheckRunsResponse = {
      total_count: 2,
      check_runs: [
        {
          id: 1,
          status: "completed",
          conclusion: "success",
        },
        {
          id: 2,
          status: "completed",
          conclusion: "success",
        },
      ] as any,
    };

    const result = aggregateCheckStatus(checkRuns);

    expect(result).toEqual({
      total: 2,
      pending: 0,
      success: 2,
      failure: 0,
    });
  });

  it("should count completed failed checks as failure", () => {
    const checkRuns: PullRequestCheckRunsResponse = {
      total_count: 3,
      check_runs: [
        {
          id: 1,
          status: "completed",
          conclusion: "failure",
        },
        {
          id: 2,
          status: "completed",
          conclusion: "cancelled",
        },
        {
          id: 3,
          status: "completed",
          conclusion: "timed_out",
        },
      ] as any,
    };

    const result = aggregateCheckStatus(checkRuns);

    expect(result).toEqual({
      total: 3,
      pending: 0,
      success: 0,
      failure: 3,
    });
  });

  it("should handle mixed check statuses correctly", () => {
    const checkRuns: PullRequestCheckRunsResponse = {
      total_count: 5,
      check_runs: [
        {
          id: 1,
          status: "queued",
          conclusion: null,
        },
        {
          id: 2,
          status: "in_progress",
          conclusion: null,
        },
        {
          id: 3,
          status: "completed",
          conclusion: "success",
        },
        {
          id: 4,
          status: "completed",
          conclusion: "failure",
        },
        {
          id: 5,
          status: "completed",
          conclusion: "skipped",
        },
      ] as any,
    };

    const result = aggregateCheckStatus(checkRuns);

    expect(result).toEqual({
      total: 5,
      pending: 2, // queued + in_progress
      success: 1, // success
      failure: 2, // failure + skipped
    });
  });

  it("should treat unknown status as pending", () => {
    const checkRuns: PullRequestCheckRunsResponse = {
      total_count: 1,
      check_runs: [
        {
          id: 1,
          status: "unknown_status" as any,
          conclusion: null,
        },
      ] as any,
    };

    const result = aggregateCheckStatus(checkRuns);

    expect(result).toEqual({
      total: 1,
      pending: 1,
      success: 0,
      failure: 0,
    });
  });
});
