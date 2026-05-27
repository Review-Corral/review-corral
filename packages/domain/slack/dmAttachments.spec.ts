import { describe, expect, it } from "vitest";
import { getDmAttachment, getReviewRequestDmAttachment } from "./dmAttachments";

describe("dmAttachments", () => {
  it("renders a linked title without a View button for standard PR DMs", () => {
    const attachment = getDmAttachment(
      {
        title: "Fix queue | merge <state>",
        number: 42,
        html_url: "https://github.com/test/repo/pull/42",
      },
      "blue",
    );

    expect(attachment.blocks).toEqual([
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*<https://github.com/test/repo/pull/42|Fix queue ¦ merge &lt;state&gt; #42>*",
        },
      },
    ]);
    expect(attachment.blocks).not.toContainEqual(
      expect.objectContaining({ type: "actions" }),
    );
  });

  it("renders a linked title without a View button for review request DMs", () => {
    const attachment = getReviewRequestDmAttachment(
      {
        title: "Review queue fix",
        number: 43,
        html_url: "https://github.com/test/repo/pull/43",
        body: null,
        additions: 10,
        deletions: 2,
        base: { ref: "main" },
        user: { avatar_url: "https://github.com/author.png" },
      },
      {
        full_name: "test/repo",
        owner: { avatar_url: "https://github.com/owner.png" },
      },
      "<@U123>",
      "blue",
    );

    expect(attachment.blocks?.[0]).toEqual({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*<https://github.com/test/repo/pull/43|Review queue fix #43>*",
      },
    });
    expect(attachment.blocks).not.toContainEqual(
      expect.objectContaining({ type: "actions" }),
    );
  });
});
