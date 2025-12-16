// Regex to match img tags
const IMG_TAG_REGEX = /<img\s+[^>]*>/gi;

/**
 * Extracts the src attribute value from an img tag string.
 */
function extractSrc(imgTag: string): string | null {
  const match = imgTag.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

/**
 * Extracts the alt attribute value from an img tag string.
 */
function extractAlt(imgTag: string): string | null {
  const match = imgTag.match(/alt=["']([^"']*)["']/i);
  return match ? match[1] : null;
}

/**
 * Converts `<img>` tags in HTML content to markdown-style links.
 * GitHub user-attachment URLs are not publicly accessible, so we convert
 * images to clickable links instead of trying to render them as Slack
 * image blocks.
 *
 * Example: `<img src="https://..." alt="Screenshot" />` becomes
 *          `[Screenshot](https://...)`
 */
export function convertImagesToLinks(body: string): string {
  return body.replace(IMG_TAG_REGEX, (imgTag) => {
    const url = extractSrc(imgTag);
    if (!url) return "";

    const alt = extractAlt(imgTag)?.trim() || "Image";
    return `[${alt}](${url})`;
  });
}
