export interface ExtractedImage {
  url: string;
  altText: string;
}

export interface ImageExtractionResult {
  cleanedBody: string;
  images: ExtractedImage[];
}

/**
 * Represents a Slack image block. This is a simplified type matching
 * Slack's Block Kit image block structure.
 */
export interface SlackImageBlock {
  type: "image";
  image_url: string;
  alt_text: string;
}

const MAX_IMAGES = 3;
const DEFAULT_ALT_TEXT = "PR description image";

// Regex to capture src and alt attributes from img tags (handles attributes in any
// order). Note: GitHub generates img tags with predictable structure.
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
 * Extracts `<img>` tags from HTML content and returns both the cleaned text
 * and the extracted image information. Images are limited to MAX_IMAGES.
 */
export function extractImagesFromHtml(body: string): ImageExtractionResult {
  const images: ExtractedImage[] = [];
  const imgTags = body.match(IMG_TAG_REGEX) || [];

  for (const imgTag of imgTags) {
    if (images.length >= MAX_IMAGES) break;

    const url = extractSrc(imgTag);
    if (!url) continue;

    // Only include HTTPS URLs (Slack requirement)
    if (!url.startsWith("https://")) continue;

    const altText = extractAlt(imgTag)?.trim() || DEFAULT_ALT_TEXT;
    images.push({ url, altText });
  }

  // Remove all img tags from the body (including ones beyond the limit)
  const cleanedBody = body.replace(IMG_TAG_REGEX, "").trim();

  return { cleanedBody, images };
}

/**
 * Converts extracted images to Slack image block format.
 */
export function imagesToSlackBlocks(images: ExtractedImage[]): SlackImageBlock[] {
  return images.map((image) => ({
    type: "image" as const,
    image_url: image.url,
    alt_text: image.altText.slice(0, 2000), // Slack limit
  }));
}
