import { CheckStatus } from "@domain/slack/mainMessage";
import { PullRequestCheckRunsResponse } from "./endpointTypes";

/**
 * Converts GitHub check runs response to our CheckStatus format
 */
export function aggregateCheckStatus(
  checkRuns: PullRequestCheckRunsResponse,
): CheckStatus {
  const total = checkRuns.total_count;
  const runs = checkRuns.check_runs;

  let pending = 0;
  let success = 0;
  let failure = 0;

  for (const run of runs) {
    switch (run.status) {
      case "queued":
      case "in_progress":
        pending++;
        break;
      case "completed":
        if (run.conclusion === "success") {
          success++;
        } else {
          // Any conclusion other than success is considered a failure
          // This includes: failure, cancelled, timed_out, action_required, neutral, skipped
          failure++;
        }
        break;
      default:
        // Unknown status, treat as pending
        pending++;
    }
  }

  return {
    total,
    pending,
    success,
    failure,
  };
}
