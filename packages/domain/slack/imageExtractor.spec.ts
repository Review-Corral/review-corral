import { describe, expect, it } from "vitest";
import { extractImagesFromHtml, imagesToSlackBlocks } from "./imageExtractor";

describe("extractImagesFromHtml", () => {
  it("should extract single image from HTML", () => {
    const body = `Some text <img src="https://github.com/user-attachments/assets/abc123" alt="Screenshot" /> more text`;

    const result = extractImagesFromHtml(body);

    expect(result.images).toHaveLength(1);
    expect(result.images[0]).toEqual({
      url: "https://github.com/user-attachments/assets/abc123",
      altText: "Screenshot",
    });
    expect(result.cleanedBody).toBe("Some text  more text");
  });

  it("should use default alt text when alt is missing", () => {
    const body = `<img src="https://example.com/image.png" />`;

    const result = extractImagesFromHtml(body);

    expect(result.images[0].altText).toBe("PR description image");
  });

  it("should use default alt text when alt is empty", () => {
    const body = `<img src="https://example.com/image.png" alt="" />`;

    const result = extractImagesFromHtml(body);

    expect(result.images[0].altText).toBe("PR description image");
  });

  it("should limit to 3 images", () => {
    const body = Array(10)
      .fill(null)
      .map((_, i) => `<img src="https://example.com/image${i}.png" alt="test" />`)
      .join(" ");

    const result = extractImagesFromHtml(body);

    expect(result.images).toHaveLength(3);
    expect(result.images[0].url).toBe("https://example.com/image0.png");
    expect(result.images[1].url).toBe("https://example.com/image1.png");
    expect(result.images[2].url).toBe("https://example.com/image2.png");
  });

  it("should remove all img tags from cleaned body even beyond limit", () => {
    const body = Array(5)
      .fill(null)
      .map((_, i) => `<img src="https://example.com/image${i}.png" alt="test" />`)
      .join(" text ");

    const result = extractImagesFromHtml(body);

    expect(result.images).toHaveLength(3);
    expect(result.cleanedBody).not.toContain("<img");
    expect(result.cleanedBody).toBe("text  text  text  text");
  });

  it("should ignore non-HTTPS URLs", () => {
    const body = `<img src="http://example.com/image.png" alt="test" />`;

    const result = extractImagesFromHtml(body);

    expect(result.images).toHaveLength(0);
  });

  it("should handle body with no images", () => {
    const body = "Just some text without images";

    const result = extractImagesFromHtml(body);

    expect(result.images).toHaveLength(0);
    expect(result.cleanedBody).toBe("Just some text without images");
  });

  it("should handle GitHub-style img tags with width/height attributes", () => {
    const body = `<img width="2522" height="2776" alt="CleanShot 2025-12-16" src="https://github.com/user-attachments/assets/9be33c13-fe7b-482d-ac7d-8170e5836b64" />`;

    const result = extractImagesFromHtml(body);

    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toBe(
      "https://github.com/user-attachments/assets/9be33c13-fe7b-482d-ac7d-8170e5836b64",
    );
    expect(result.images[0].altText).toBe("CleanShot 2025-12-16");
  });

  it("should handle img tags without self-closing slash", () => {
    const body = `<img src="https://example.com/image.png" alt="test">`;

    const result = extractImagesFromHtml(body);

    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toBe("https://example.com/image.png");
  });

  it("should handle mixed content with markdown and images", () => {
    const body = `## Description

Works properly now

<img width="2522" height="2776" alt="Screenshot" src="https://github.com/user-attachments/assets/abc123" />

Some more text here.`;

    const result = extractImagesFromHtml(body);

    expect(result.images).toHaveLength(1);
    expect(result.cleanedBody).toBe(`## Description

Works properly now



Some more text here.`);
  });
});

describe("imagesToSlackBlocks", () => {
  it("should convert images to Slack ImageBlock format", () => {
    const images = [{ url: "https://example.com/img.png", altText: "Test image" }];

    const blocks = imagesToSlackBlocks(images);

    expect(blocks).toEqual([
      {
        type: "image",
        image_url: "https://example.com/img.png",
        alt_text: "Test image",
      },
    ]);
  });

  it("should truncate alt_text to 2000 characters", () => {
    const longAlt = "a".repeat(3000);
    const images = [{ url: "https://example.com/img.png", altText: longAlt }];

    const blocks = imagesToSlackBlocks(images);

    expect(blocks[0].alt_text).toHaveLength(2000);
  });

  it("should handle multiple images", () => {
    const images = [
      { url: "https://example.com/img1.png", altText: "Image 1" },
      { url: "https://example.com/img2.png", altText: "Image 2" },
    ];

    const blocks = imagesToSlackBlocks(images);

    expect(blocks).toHaveLength(2);
    expect(blocks[0].image_url).toBe("https://example.com/img1.png");
    expect(blocks[1].image_url).toBe("https://example.com/img2.png");
  });

  it("should return empty array for empty input", () => {
    const blocks = imagesToSlackBlocks([]);

    expect(blocks).toEqual([]);
  });
});
