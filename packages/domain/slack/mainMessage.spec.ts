import { PullRequestItem } from "@core/dynamodb/entities/types";
import { beforeEach, describe, expect, it } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  CheckStatus,
  RequiredApprovalsQueryPayloadArg,
  buidMainMessageAttachements,
  getCheckStatusAttachment,
  getQueuedToMergeAttachment,
} from "./mainMessage";

describe("mainMessage", () => {
  let mockPullRequestItem: PullRequestItem;
  let mockBody: any;

  beforeEach(() => {
    mockPullRequestItem = mock<PullRequestItem>({
      prId: 123,
      repoId: 456,
      threadTs: "thread-ts-123",
      isDraft: false,
      isQueuedToMerge: false,
      requiredApprovals: 2,
      approvalCount: 1,
    });

    mockBody = {
      pull_request: {
        id: 123,
        title: "Test PR",
        number: 1,
        draft: false,
        merged: false,
        closed_at: null,
        html_url: "https://github.com/test/repo/pull/1",
        user: {
          login: "testuser",
          avatar_url: "https://github.com/testuser.png",
        },
        body: "Test PR body",
        additions: 10,
        deletions: 5,
        base: {
          ref: "main",
        },
      },
      repository: {
        id: 456,
        full_name: "test/repo",
        owner: {
          avatar_url: "https://github.com/test.png",
        },
      },
    };
  });

  describe("buidMainMessageAttachements", () => {
    it("should include queued to merge attachment when PR is queued", () => {
      const queuedPrItem = {
        ...mockPullRequestItem,
        isQueuedToMerge: true,
      };

      const attachments = buidMainMessageAttachements({
        body: mockBody,
        slackUsername: "@testuser",
        pullRequestItem: queuedPrItem,
        requiredApprovals: null,
        checkStatus: null,
      });

      expect(attachments).toHaveLength(3); // base + approvals + queued

      const queuedAttachment = attachments.find((attachment) =>
        attachment.blocks?.some(
          (block) =>
            block.type === "section" &&
            "text" in block &&
            block.text?.text?.includes("Queued to merge"),
        ),
      );

      expect(queuedAttachment).toBeDefined();
      expect(queuedAttachment?.color).toBe("#D9CD27");
    });

    it("should not include queued attachment when PR is not queued", () => {
      const attachments = buidMainMessageAttachements({
        body: mockBody,
        slackUsername: "@testuser",
        pullRequestItem: mockPullRequestItem,
        requiredApprovals: null,
        checkStatus: null,
      });

      const queuedAttachment = attachments.find((attachment) =>
        attachment.blocks?.some(
          (block) =>
            block.type === "section" &&
            "text" in block &&
            block.text?.text?.includes("Queued to merge"),
        ),
      );

      expect(queuedAttachment).toBeUndefined();
    });

    it("should include merged attachment when PR is merged and not queued", () => {
      const mergedBody = {
        ...mockBody,
        pull_request: {
          ...mockBody.pull_request,
          merged: true,
        },
      };

      const nonQueuedPrItem = {
        ...mockPullRequestItem,
        isQueuedToMerge: false,
      };

      const attachments = buidMainMessageAttachements({
        body: mergedBody,
        slackUsername: "@testuser",
        pullRequestItem: nonQueuedPrItem,
        requiredApprovals: null,
        checkStatus: null,
      });

      const mergedAttachment = attachments.find((attachment) =>
        attachment.blocks?.some(
          (block) =>
            block.type === "section" &&
            "text" in block &&
            block.text?.text?.includes("Pull request merged"),
        ),
      );

      const queuedAttachment = attachments.find((attachment) =>
        attachment.blocks?.some(
          (block) =>
            block.type === "section" &&
            "text" in block &&
            block.text?.text?.includes("Queued to merge"),
        ),
      );

      expect(mergedAttachment).toBeDefined();
      expect(queuedAttachment).toBeUndefined();
    });

    it("should include draft attachment when PR is draft", () => {
      const draftBody = {
        ...mockBody,
        pull_request: {
          ...mockBody.pull_request,
          draft: true,
        },
      };

      const attachments = buidMainMessageAttachements({
        body: draftBody,
        slackUsername: "@testuser",
        pullRequestItem: mockPullRequestItem,
        requiredApprovals: null,
        checkStatus: null,
      });

      const draftAttachment = attachments.find((attachment) =>
        attachment.blocks?.some(
          (block) =>
            block.type === "section" &&
            "text" in block &&
            block.text?.text?.includes("Pull request converted back to draft"),
        ),
      );

      expect(draftAttachment).toBeDefined();
      expect(draftAttachment?.color).toBe("#D9CD27");
    });

    it("should include closed attachment when PR is closed but not merged", () => {
      const closedBody = {
        ...mockBody,
        pull_request: {
          ...mockBody.pull_request,
          closed_at: "2023-01-01T00:00:00Z",
          merged: false,
        },
      };

      const attachments = buidMainMessageAttachements({
        body: closedBody,
        slackUsername: "@testuser",
        pullRequestItem: mockPullRequestItem,
        requiredApprovals: null,
        checkStatus: null,
      });

      const closedAttachment = attachments.find((attachment) =>
        attachment.blocks?.some(
          (block) =>
            block.type === "section" &&
            "text" in block &&
            block.text?.text?.includes("Pull request closed by @testuser"),
        ),
      );

      expect(closedAttachment).toBeDefined();
      expect(closedAttachment?.color).toBe("#FB0909");
    });

    it("should include approval status attachment when required approvals are configured", () => {
      const requiredApprovals: RequiredApprovalsQueryPayloadArg = { count: 3 };

      const attachments = buidMainMessageAttachements({
        body: mockBody,
        slackUsername: "@testuser",
        pullRequestItem: mockPullRequestItem,
        requiredApprovals: requiredApprovals,
        checkStatus: null,
      });

      const approvalAttachment = attachments.find((attachment) =>
        attachment.blocks?.some(
          (block) =>
            block.type === "section" &&
            "text" in block &&
            block.text?.text?.includes("approvals met"),
        ),
      );

      expect(approvalAttachment).toBeDefined();
    });
  });

  describe("getQueuedToMergeAttachment", () => {
    it("should return correct attachment structure", () => {
      const attachment = getQueuedToMergeAttachment();

      expect(attachment).toEqual({
        color: "#D9CD27",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: ":large_yellow_circle: Queued to merge",
            },
          },
        ],
      });
    });
  });

  describe("getCheckStatusAttachment", () => {
    it("should return null for null check status", () => {
      const attachment = getCheckStatusAttachment(null);
      expect(attachment).toBeNull();
    });

    it("should return null for empty check status", () => {
      const checkStatus: CheckStatus = {
        total: 0,
        pending: 0,
        success: 0,
        failure: 0,
      };
      const attachment = getCheckStatusAttachment(checkStatus);
      expect(attachment).toBeNull();
    });

    it("should show pending status with hourglass when checks are pending", () => {
      const checkStatus: CheckStatus = {
        total: 3,
        pending: 2,
        success: 1,
        failure: 0,
      };
      const attachment = getCheckStatusAttachment(checkStatus);

      expect(attachment).toEqual({
        color: "#D9CD27",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: ":hourglass_flowing_sand: 1/3 checks completed",
            },
          },
        ],
      });
    });

    it("should show success status when all checks pass", () => {
      const checkStatus: CheckStatus = {
        total: 3,
        pending: 0,
        success: 3,
        failure: 0,
      };
      const attachment = getCheckStatusAttachment(checkStatus);

      expect(attachment).toEqual({
        color: "#02A101",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: ":white_check_mark: 3/3 checks passed",
            },
          },
        ],
      });
    });

    it("should show failure status when some checks fail", () => {
      const checkStatus: CheckStatus = {
        total: 3,
        pending: 0,
        success: 1,
        failure: 2,
      };
      const attachment = getCheckStatusAttachment(checkStatus);

      expect(attachment).toEqual({
        color: "#FB0909",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: ":x: 2/3 checks failed",
            },
          },
        ],
      });
    });

    it("should prioritize pending status over failure status", () => {
      const checkStatus: CheckStatus = {
        total: 4,
        pending: 1,
        success: 1,
        failure: 2,
      };
      const attachment = getCheckStatusAttachment(checkStatus);

      expect(attachment?.color).toBe("#D9CD27");
      expect(attachment?.blocks?.[0]).toMatchObject({
        text: {
          text: ":hourglass_flowing_sand: 3/4 checks completed",
        },
      });
    });
  });
});
