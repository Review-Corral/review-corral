import {
  PullRequestReviewerStatus,
  ReviewerStatusState,
  ReviewerStatusStateType,
} from "@domain/postgres/schema";

type SubmittedReviewState = "approved" | "changes_requested" | "commented";

export function syncReviewerStatusesWithRequestedReviewers({
  currentStatuses,
  requestedReviewerLogins,
}: {
  currentStatuses: PullRequestReviewerStatus[];
  requestedReviewerLogins: string[];
}): PullRequestReviewerStatus[] {
  const requestedSet = new Set(requestedReviewerLogins);
  const nextStatuses: PullRequestReviewerStatus[] = [];

  for (const status of currentStatuses) {
    if (requestedSet.has(status.login)) {
      nextStatuses.push({
        ...status,
        isCurrentlyRequested: true,
      });
      continue;
    }

    if (status.lastReviewState === ReviewerStatusState.PENDING) {
      continue;
    }

    nextStatuses.push({
      ...status,
      isCurrentlyRequested: false,
      isReRequested: false,
    });
  }

  for (const login of requestedReviewerLogins) {
    if (nextStatuses.some((status) => status.login === login)) {
      continue;
    }

    nextStatuses.push({
      login,
      lastReviewState: ReviewerStatusState.PENDING,
      isCurrentlyRequested: true,
      isReRequested: false,
    });
  }

  return nextStatuses;
}

export function markReviewerRequested({
  currentStatuses,
  reviewerLogin,
}: {
  currentStatuses: PullRequestReviewerStatus[];
  reviewerLogin: string;
}): PullRequestReviewerStatus[] {
  const nextStatuses = [...currentStatuses];
  const existingIndex = nextStatuses.findIndex(
    (status) => status.login === reviewerLogin,
  );

  if (existingIndex === -1) {
    nextStatuses.push({
      login: reviewerLogin,
      lastReviewState: ReviewerStatusState.PENDING,
      isCurrentlyRequested: true,
      isReRequested: false,
    });
    return nextStatuses;
  }

  const existing = nextStatuses[existingIndex];
  nextStatuses[existingIndex] = {
    ...existing,
    isCurrentlyRequested: true,
    isReRequested: existing.lastReviewState !== ReviewerStatusState.PENDING,
  };

  return nextStatuses;
}

export function applySubmittedReviewToReviewerStatuses({
  currentStatuses,
  reviewerLogin,
  reviewState,
}: {
  currentStatuses: PullRequestReviewerStatus[];
  reviewerLogin: string;
  reviewState: SubmittedReviewState;
}): PullRequestReviewerStatus[] {
  const nextReviewState = normalizeSubmittedReviewState(reviewState);
  const nextStatuses = [...currentStatuses];
  const existingIndex = nextStatuses.findIndex(
    (status) => status.login === reviewerLogin,
  );

  const nextStatus: PullRequestReviewerStatus = {
    login: reviewerLogin,
    lastReviewState: nextReviewState,
    isCurrentlyRequested: false,
    isReRequested: false,
  };

  if (existingIndex === -1) {
    nextStatuses.push(nextStatus);
    return nextStatuses;
  }

  nextStatuses[existingIndex] = nextStatus;
  return nextStatuses;
}

export function removeReviewerFromReviewerStatuses({
  currentStatuses,
  reviewerLogin,
}: {
  currentStatuses: PullRequestReviewerStatus[];
  reviewerLogin: string;
}): PullRequestReviewerStatus[] {
  return currentStatuses.filter((status) => status.login !== reviewerLogin);
}

export function getReviewerStatusesForDisplay({
  reviewerStatuses,
  requestedReviewerLogins,
}: {
  reviewerStatuses: PullRequestReviewerStatus[];
  requestedReviewerLogins: string[];
}): PullRequestReviewerStatus[] {
  if (reviewerStatuses.length > 0) {
    return reviewerStatuses;
  }

  return requestedReviewerLogins.map((login) => ({
    login,
    lastReviewState: ReviewerStatusState.PENDING,
    isCurrentlyRequested: true,
    isReRequested: false,
  }));
}

function normalizeSubmittedReviewState(
  state: SubmittedReviewState,
): ReviewerStatusStateType {
  switch (state) {
    case "approved":
      return ReviewerStatusState.APPROVED;
    case "changes_requested":
      return ReviewerStatusState.CHANGES_REQUESTED;
    case "commented":
      return ReviewerStatusState.COMMENTED;
  }
}
