import { describe, expect, it } from "vitest";
import {
  applySubmittedReviewToReviewerStatuses,
  markReviewerRequested,
  removeReviewerFromReviewerStatuses,
  syncReviewerStatusesWithRequestedReviewers,
} from "./reviewerStatuses";

describe("reviewerStatuses", () => {
  it("should mark a commenter as re-requested when they are asked to review again", () => {
    const nextStatuses = markReviewerRequested({
      currentStatuses: [
        {
          login: "micthiesen",
          lastReviewState: "commented",
          isCurrentlyRequested: false,
          isReRequested: false,
        },
      ],
      reviewerLogin: "micthiesen",
    });

    expect(nextStatuses).toEqual([
      {
        login: "micthiesen",
        lastReviewState: "commented",
        isCurrentlyRequested: true,
        isReRequested: true,
      },
    ]);
  });

  it("should mark an approver as re-requested when they are asked to review again", () => {
    const nextStatuses = markReviewerRequested({
      currentStatuses: [
        {
          login: "micthiesen",
          lastReviewState: "approved",
          isCurrentlyRequested: false,
          isReRequested: false,
        },
      ],
      reviewerLogin: "micthiesen",
    });

    expect(nextStatuses).toEqual([
      {
        login: "micthiesen",
        lastReviewState: "approved",
        isCurrentlyRequested: true,
        isReRequested: true,
      },
    ]);
  });

  it("should remove an unrequested reviewer who never submitted a review", () => {
    const nextStatuses = syncReviewerStatusesWithRequestedReviewers({
      currentStatuses: [
        {
          login: "micthiesen",
          lastReviewState: "pending",
          isCurrentlyRequested: true,
          isReRequested: false,
        },
      ],
      requestedReviewerLogins: [],
    });

    expect(nextStatuses).toEqual([]);
  });

  it("should clear pending re-review flags after a submitted review", () => {
    const nextStatuses = applySubmittedReviewToReviewerStatuses({
      currentStatuses: [
        {
          login: "micthiesen",
          lastReviewState: "changes_requested",
          isCurrentlyRequested: true,
          isReRequested: true,
        },
      ],
      reviewerLogin: "micthiesen",
      reviewState: "approved",
    });

    expect(nextStatuses).toEqual([
      {
        login: "micthiesen",
        lastReviewState: "approved",
        isCurrentlyRequested: false,
        isReRequested: false,
      },
    ]);
  });

  it("should remove a reviewer completely when their review is dismissed", () => {
    const nextStatuses = removeReviewerFromReviewerStatuses({
      currentStatuses: [
        {
          login: "micthiesen",
          lastReviewState: "approved",
          isCurrentlyRequested: false,
          isReRequested: false,
        },
        {
          login: "other-reviewer",
          lastReviewState: "pending",
          isCurrentlyRequested: true,
          isReRequested: false,
        },
      ],
      reviewerLogin: "micthiesen",
    });

    expect(nextStatuses).toEqual([
      {
        login: "other-reviewer",
        lastReviewState: "pending",
        isCurrentlyRequested: true,
        isReRequested: false,
      },
    ]);
  });
});
