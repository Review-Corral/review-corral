/**
 * GitHub only supports these 8 reactions on comments.
 */
export type GitHubReaction =
  | "+1"
  | "-1"
  | "laugh"
  | "confused"
  | "heart"
  | "hooray"
  | "rocket"
  | "eyes";

/**
 * Map Slack emoji names to GitHub reactions.
 * Keys are Slack emoji names (without colons).
 */
const SLACK_TO_GITHUB_MAP: Record<string, GitHubReaction> = {
  // Thumbs up
  "+1": "+1",
  thumbsup: "+1",
  thumbs_up: "+1",

  // Thumbs down
  "-1": "-1",
  thumbsdown: "-1",
  thumbs_down: "-1",

  // Laugh/joy
  laughing: "laugh",
  smile: "laugh",
  smiley: "laugh",
  grinning: "laugh",
  joy: "laugh",
  rofl: "laugh",
  satisfied: "laugh",
  sweat_smile: "laugh",

  // Confused
  confused: "confused",
  thinking_face: "confused",
  face_with_raised_eyebrow: "confused",
  grimacing: "confused",

  // Heart
  heart: "heart",
  heart_eyes: "heart",
  sparkling_heart: "heart",
  heartpulse: "heart",
  two_hearts: "heart",
  revolving_hearts: "heart",
  hearts: "heart",

  // Hooray/celebration
  tada: "hooray",
  confetti_ball: "hooray",
  partying_face: "hooray",
  raised_hands: "hooray",
  clap: "hooray",
  trophy: "hooray",
  star: "hooray",
  star2: "hooray",

  // Rocket
  rocket: "rocket",

  // Eyes
  eyes: "eyes",
};

/**
 * Maps a Slack emoji name to a GitHub reaction.
 * Returns null if the emoji doesn't map to a GitHub reaction.
 *
 * @param slackEmoji - The Slack emoji name (may include colons)
 */
export function mapSlackEmojiToGitHub(slackEmoji: string): GitHubReaction | null {
  // Remove colons and skin tone modifiers (e.g., ":+1::skin-tone-2:" -> "+1")
  const cleaned = slackEmoji.replace(/:/g, "").replace(/::skin-tone-\d/g, "");
  return SLACK_TO_GITHUB_MAP[cleaned] ?? null;
}
