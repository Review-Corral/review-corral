import { describe, expect, it } from "vitest";
import { convertImagesToLinks } from "./imageExtractor";

describe("convertImagesToLinks", () => {
  it("should convert single image to markdown link", () => {
    const body = `Some text <img src="https://github.com/user-attachments/assets/abc123" alt="Screenshot" /> more text`;

    const result = convertImagesToLinks(body);

    expect(result).toBe(
      "Some text [Screenshot](https://github.com/user-attachments/assets/abc123) more text",
    );
  });

  it("should use default alt text when alt is missing", () => {
    const body = `<img src="https://example.com/image.png" />`;

    const result = convertImagesToLinks(body);

    expect(result).toBe("[Image](https://example.com/image.png)");
  });

  it("should use default alt text when alt is empty", () => {
    const body = `<img src="https://example.com/image.png" alt="" />`;

    const result = convertImagesToLinks(body);

    expect(result).toBe("[Image](https://example.com/image.png)");
  });

  it("should convert multiple images", () => {
    const body = `First <img src="https://example.com/img1.png" alt="First" /> Second <img src="https://example.com/img2.png" alt="Second" />`;

    const result = convertImagesToLinks(body);

    expect(result).toBe(
      "First [First](https://example.com/img1.png) Second [Second](https://example.com/img2.png)",
    );
  });

  it("should handle body with no images", () => {
    const body = "Just some text without images";

    const result = convertImagesToLinks(body);

    expect(result).toBe("Just some text without images");
  });

  it("should handle GitHub-style img tags with width/height attributes", () => {
    const body = `<img width="2522" height="2776" alt="CleanShot 2025-12-16" src="https://github.com/user-attachments/assets/9be33c13-fe7b-482d-ac7d-8170e5836b64" />`;

    const result = convertImagesToLinks(body);

    expect(result).toBe(
      "[CleanShot 2025-12-16](https://github.com/user-attachments/assets/9be33c13-fe7b-482d-ac7d-8170e5836b64)",
    );
  });

  it("should handle img tags without self-closing slash", () => {
    const body = `<img src="https://example.com/image.png" alt="test">`;

    const result = convertImagesToLinks(body);

    expect(result).toBe("[test](https://example.com/image.png)");
  });

  it("should handle mixed content with markdown and images", () => {
    const body = `## Description

Works properly now

<img width="2522" height="2776" alt="Screenshot" src="https://github.com/user-attachments/assets/abc123" />

Some more text here.`;

    const result = convertImagesToLinks(body);

    expect(result).toBe(`## Description

Works properly now

[Screenshot](https://github.com/user-attachments/assets/abc123)

Some more text here.`);
  });

  it("should remove img tag if src is missing", () => {
    const body = `Before <img alt="test" /> After`;

    const result = convertImagesToLinks(body);

    expect(result).toBe("Before  After");
  });
});
