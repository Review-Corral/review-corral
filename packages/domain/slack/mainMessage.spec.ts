import { type PullRequest } from "@domain/postgres/schema";
import { beforeEach, describe, expect, it } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  RequiredApprovalsQueryPayloadArg,
  buidMainMessageAttachements,
  getQueuedToMergeAttachment,
} from "./mainMessage";

describe("mainMessage", () => {
  let mockPullRequestItem: PullRequest;
  let mockBody: any;

  beforeEach(() => {
    mockPullRequestItem = mock<PullRequest>({
      id: 123,
      repoId: 456,
      prNumber: 1,
      threadTs: "thread-ts-123",
      isDraft: false,
      isQueuedToMerge: false,
      requiredApprovals: 2,
      approvalCount: 1,
      requestedReviewers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
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

  describe("image handling in PR body", () => {
    it("should convert img tags to clickable links", () => {
      const bodyWithImage = {
        ...mockBody,
        pull_request: {
          ...mockBody.pull_request,
          body: `Description\n\n<img src="https://github.com/user-attachments/assets/abc123" alt="Screenshot" />`,
        },
      };

      const attachments = buidMainMessageAttachements({
        body: bodyWithImage,
        slackUsername: "@testuser",
        pullRequestItem: mockPullRequestItem,
        requiredApprovals: null,
      });

      const baseAttachment = attachments[0];
      const sectionBlock = baseAttachment.blocks?.find(
        (block) => block.type === "section" && "text" in block,
      );

      expect(sectionBlock).toBeDefined();
      if (sectionBlock && "text" in sectionBlock && sectionBlock.text) {
        const textContent =
          typeof sectionBlock.text === "string"
            ? sectionBlock.text
            : sectionBlock.text.text;
        // Should not contain raw img tags
        expect(textContent).not.toContain("<img");
        // slackifyMarkdown converts [text](url) to <url|text>
        expect(textContent).toContain("Screenshot");
      }
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

    it("should not include reviewer attachment when no reviewers requested", () => {
      const attachments = buidMainMessageAttachements({
        body: mockBody,
        slackUsername: "@testuser",
        pullRequestItem: mockPullRequestItem,
        requiredApprovals: null,
      });

      const reviewerAttachment = attachments.find((attachment) =>
        attachment.blocks?.some(
          (block) =>
            block.type === "section" &&
            "text" in block &&
            block.text?.text?.includes("Requested reviewers"),
        ),
      );

      expect(reviewerAttachment).toBeUndefined();
    });

    it("should include single reviewer in attachment", () => {
      const prWithReviewer = {
        ...mockPullRequestItem,
        requestedReviewers: ["reviewer1"],
      };

      const attachments = buidMainMessageAttachements({
        body: mockBody,
        slackUsername: "@testuser",
        pullRequestItem: prWithReviewer,
        requiredApprovals: null,
      });

      const reviewerAttachment = attachments.find((attachment) =>
        attachment.blocks?.some(
          (block) =>
            block.type === "section" &&
            "text" in block &&
            block.text?.text?.includes("Requested reviewers"),
        ),
      );

      expect(reviewerAttachment).toBeDefined();
      expect(reviewerAttachment?.color).toBe("#0366d6");
      expect(reviewerAttachment?.blocks?.[0]).toMatchObject({
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":eyes: Requested reviewers: reviewer1",
        },
      });
    });

    it("should include multiple reviewers comma-separated", () => {
      const prWithReviewers = {
        ...mockPullRequestItem,
        requestedReviewers: ["reviewer1", "reviewer2", "reviewer3"],
      };

      const attachments = buidMainMessageAttachements({
        body: mockBody,
        slackUsername: "@testuser",
        pullRequestItem: prWithReviewers,
        requiredApprovals: null,
      });

      const reviewerAttachment = attachments.find((attachment) =>
        attachment.blocks?.some(
          (block) =>
            block.type === "section" &&
            "text" in block &&
            block.text?.text?.includes("Requested reviewers"),
        ),
      );

      expect(reviewerAttachment).toBeDefined();
      expect(reviewerAttachment?.blocks?.[0]).toMatchObject({
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":eyes: Requested reviewers: reviewer1, reviewer2, reviewer3",
        },
      });
    });

    it("should position reviewer attachment between approvals and status", () => {
      const prWithReviewers = {
        ...mockPullRequestItem,
        requestedReviewers: ["reviewer1"],
        isDraft: true,
      };

      const attachments = buidMainMessageAttachements({
        body: { ...mockBody, pull_request: { ...mockBody.pull_request, draft: true } },
        slackUsername: "@testuser",
        pullRequestItem: prWithReviewers,
        requiredApprovals: { count: 2 },
      });

      expect(attachments).toHaveLength(4); // base + approvals + reviewers + draft

      const reviewerIndex = attachments.findIndex((att) =>
        att.blocks?.some(
          (block) =>
            block.type === "section" &&
            "text" in block &&
            block.text?.text?.includes("Requested reviewers"),
        ),
      );

      const approvalsIndex = attachments.findIndex((att) =>
        att.blocks?.some(
          (block) =>
            block.type === "section" &&
            "text" in block &&
            block.text?.text?.includes("approvals met"),
        ),
      );

      const draftIndex = attachments.findIndex((att) =>
        att.blocks?.some(
          (block) =>
            block.type === "section" &&
            "text" in block &&
            block.text?.text?.includes("draft"),
        ),
      );

      expect(approvalsIndex).toBeLessThan(reviewerIndex);
      expect(reviewerIndex).toBeLessThan(draftIndex);
    });
  });
});
