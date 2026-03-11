import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@domain/postgres/fetchers/slack-processed-events", () => ({
  markSlackEventProcessed: vi.fn(),
}));
vi.mock("@domain/postgres/fetchers/slack-comment-dm-mappings", () => ({
  findSlackCommentDmMapping: vi.fn(),
}));
vi.mock("@domain/postgres/fetchers/members", () => ({
  getOrgMemberBySlackId: vi.fn(),
  getOrgMemberByUsername: vi.fn(),
}));
vi.mock("@domain/postgres/fetchers/slack-reaction-mirrors", () => ({
  upsertSlackReactionMirror: vi.fn(),
  findSlackReactionMirror: vi.fn(),
  deleteSlackReactionMirror: vi.fn(),
}));
vi.mock("@domain/postgres/fetchers/slack-integrations", () => ({
  getSlackInstallationsForOrganization: vi.fn(),
}));
vi.mock("@domain/github/fetchers", () => ({
  createIssueCommentReaction: vi.fn(),
  createPullRequestReviewCommentReaction: vi.fn(),
  deleteIssueCommentReaction: vi.fn(),
  deletePullRequestReviewCommentReaction: vi.fn(),
}));

const postDirectMessage = vi.fn();
vi.mock("../SlackClient", () => ({
  SlackClient: class {
    postDirectMessage = postDirectMessage;
  },
}));

import {
  createIssueCommentReaction,
  deleteIssueCommentReaction,
} from "@domain/github/fetchers";
import { getOrgMemberBySlackId, getOrgMemberByUsername } from "@domain/postgres/fetchers/members";
import { findSlackCommentDmMapping } from "@domain/postgres/fetchers/slack-comment-dm-mappings";
import { markSlackEventProcessed } from "@domain/postgres/fetchers/slack-processed-events";
import { getSlackInstallationsForOrganization } from "@domain/postgres/fetchers/slack-integrations";
import {
  deleteSlackReactionMirror,
  findSlackReactionMirror,
  upsertSlackReactionMirror,
} from "@domain/postgres/fetchers/slack-reaction-mirrors";
import { handleSlackReactionEvent } from "./reactionEvent";

describe("handleSlackReactionEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(markSlackEventProcessed).mockResolvedValue(true);
  });

  it("handles reaction_added by syncing to GitHub and DMing author", async () => {
    vi.mocked(findSlackCommentDmMapping).mockResolvedValue({
      orgId: 1,
      slackTeamId: "T1",
      targetType: "issue_comment",
      owner: "acme",
      repo: "repo",
      githubCommentId: 123,
      commentAuthorGithubUsername: "author",
      prTitle: "A PR",
      prNumber: 12,
      commentUrl: "https://github.com/acme/repo/pull/12#issuecomment-1",
      commentBody: "Looks good",
    } as any);
    vi.mocked(getOrgMemberBySlackId).mockResolvedValue({
      ghAccessToken: "gh-token",
    } as any);
    vi.mocked(createIssueCommentReaction).mockResolvedValue({ id: 555 } as any);
    vi.mocked(getOrgMemberByUsername).mockResolvedValue({
      slackId: "U_AUTHOR",
    } as any);
    vi.mocked(getSlackInstallationsForOrganization).mockResolvedValue([
      { slackTeamId: "T1", accessToken: "xoxb-1", channelId: "C1" },
    ] as any);

    await handleSlackReactionEvent({
      eventId: "Ev1",
      event: {
        type: "reaction_added",
        user: "U_REACTOR",
        reaction: "thumbsup",
        item: {
          type: "message",
          channel: "D123",
          ts: "111.222",
        },
      },
    });

    expect(createIssueCommentReaction).toHaveBeenCalled();
    expect(upsertSlackReactionMirror).toHaveBeenCalled();
    expect(postDirectMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        slackUserId: "U_AUTHOR",
      }),
    );
  });

  it("skips reaction when no GitHub token for reactor", async () => {
    vi.mocked(findSlackCommentDmMapping).mockResolvedValue({
      orgId: 1,
      slackTeamId: "T1",
      targetType: "issue_comment",
    } as any);
    vi.mocked(getOrgMemberBySlackId).mockResolvedValue(undefined);

    await handleSlackReactionEvent({
      eventId: "Ev2",
      event: {
        type: "reaction_added",
        user: "U_REACTOR",
        reaction: "thumbsup",
        item: {
          type: "message",
          channel: "D123",
          ts: "111.333",
        },
      },
    });

    expect(createIssueCommentReaction).not.toHaveBeenCalled();
    expect(postDirectMessage).not.toHaveBeenCalled();
  });

  it("handles reaction_removed when mirrored reaction exists", async () => {
    vi.mocked(findSlackCommentDmMapping).mockResolvedValue({
      orgId: 1,
      slackTeamId: "T1",
      targetType: "issue_comment",
    } as any);
    vi.mocked(getOrgMemberBySlackId).mockResolvedValue({
      ghAccessToken: "gh-token",
    } as any);
    vi.mocked(findSlackReactionMirror).mockResolvedValue({
      targetType: "issue_comment",
      owner: "acme",
      repo: "repo",
      githubCommentId: "123",
      githubReactionId: "555",
    } as any);

    await handleSlackReactionEvent({
      eventId: "Ev3",
      event: {
        type: "reaction_removed",
        user: "U_REACTOR",
        reaction: "thumbsup",
        item: {
          type: "message",
          channel: "D123",
          ts: "111.444",
        },
      },
    });

    expect(deleteIssueCommentReaction).toHaveBeenCalled();
    expect(deleteSlackReactionMirror).toHaveBeenCalled();
  });

  it("ignores duplicate event IDs", async () => {
    vi.mocked(markSlackEventProcessed).mockResolvedValue(false);

    await handleSlackReactionEvent({
      eventId: "Ev4",
      event: {
        type: "reaction_added",
        user: "U_REACTOR",
        reaction: "thumbsup",
        item: {
          type: "message",
          channel: "D123",
          ts: "111.555",
        },
      },
    });

    expect(findSlackCommentDmMapping).not.toHaveBeenCalled();
  });
});
