import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../client";
import { slackReactionMirrors, type SlackReactionMirror } from "../schema";

export async function upsertSlackReactionMirror({
  slackChannelId,
  slackMessageTs,
  reactorSlackUserId,
  emoji,
  targetType,
  owner,
  repo,
  githubCommentId,
  githubReactionId,
}: {
  slackChannelId: string;
  slackMessageTs: string;
  reactorSlackUserId: string;
  emoji: string;
  targetType: SlackReactionMirror["targetType"];
  owner: string;
  repo: string;
  githubCommentId: string;
  githubReactionId: string;
}): Promise<void> {
  await db
    .insert(slackReactionMirrors)
    .values({
      id: nanoid(),
      slackChannelId,
      slackMessageTs,
      reactorSlackUserId,
      emoji,
      targetType,
      owner,
      repo,
      githubCommentId,
      githubReactionId,
    })
    .onConflictDoUpdate({
      target: [
        slackReactionMirrors.slackChannelId,
        slackReactionMirrors.slackMessageTs,
        slackReactionMirrors.reactorSlackUserId,
        slackReactionMirrors.emoji,
      ],
      set: {
        targetType,
        owner,
        repo,
        githubCommentId,
        githubReactionId,
      },
    });
}

export async function findSlackReactionMirror({
  slackChannelId,
  slackMessageTs,
  reactorSlackUserId,
  emoji,
}: {
  slackChannelId: string;
  slackMessageTs: string;
  reactorSlackUserId: string;
  emoji: string;
}): Promise<SlackReactionMirror | null> {
  const result = await db
    .select()
    .from(slackReactionMirrors)
    .where(
      and(
        eq(slackReactionMirrors.slackChannelId, slackChannelId),
        eq(slackReactionMirrors.slackMessageTs, slackMessageTs),
        eq(slackReactionMirrors.reactorSlackUserId, reactorSlackUserId),
        eq(slackReactionMirrors.emoji, emoji),
      ),
    )
    .limit(1);

  return result[0] ?? null;
}

export async function deleteSlackReactionMirror({
  slackChannelId,
  slackMessageTs,
  reactorSlackUserId,
  emoji,
}: {
  slackChannelId: string;
  slackMessageTs: string;
  reactorSlackUserId: string;
  emoji: string;
}): Promise<void> {
  await db
    .delete(slackReactionMirrors)
    .where(
      and(
        eq(slackReactionMirrors.slackChannelId, slackChannelId),
        eq(slackReactionMirrors.slackMessageTs, slackMessageTs),
        eq(slackReactionMirrors.reactorSlackUserId, reactorSlackUserId),
        eq(slackReactionMirrors.emoji, emoji),
      ),
    );
}
