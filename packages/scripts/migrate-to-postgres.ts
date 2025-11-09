import { Db } from "../domain/dynamodb/client";
import { db } from "../domain/postgres/client";
import {
  branches,
  organizationMembers,
  organizations,
  pullRequests,
  repositories,
  slackIntegrations,
  subscriptions,
  users,
} from "../domain/postgres/schema";

console.log("🚀 Starting DynamoDB → Postgres Migration\n");

const stats = {
  organizations: { success: 0, skipped: 0, errors: 0 },
  users: { success: 0, skipped: 0, errors: 0 },
  organizationMembers: { success: 0, skipped: 0, errors: 0 },
  repositories: { success: 0, skipped: 0, errors: 0 },
  pullRequests: { success: 0, skipped: 0, errors: 0 },
  branches: { success: 0, skipped: 0, errors: 0 },
  slackIntegrations: { success: 0, skipped: 0, errors: 0 },
  subscriptions: { success: 0, skipped: 0, errors: 0 },
};

// 1. Migrate Organizations
console.log("📦 Migrating Organizations...");
const dynamoOrgs = await Db.entities.organization.scan.go();
for (const org of dynamoOrgs.data) {
  try {
    await db
      .insert(organizations)
      .values({
        id: org.orgId,
        name: org.name,
        avatarUrl: org.avatarUrl,
        billingEmail: org.billingEmail ?? undefined,
        installationId: org.installationId,
        type: org.type,
        stripeCustomerId: org.customerId ?? undefined,
        stripeSubscriptionStatus: org.stripeSubStatus ?? undefined,
      })
      .onConflictDoNothing();
    stats.organizations.success++;
  } catch (error) {
    console.error(`  ❌ Failed to migrate org ${org.orgId}:`, error);
    stats.organizations.errors++;
  }
}
console.log(
  `  ✅ Migrated ${stats.organizations.success} organizations (${stats.organizations.errors} errors)\n`,
);

// 2. Migrate Users (from Members)
console.log("👤 Migrating Users...");
const dynamoMembers = await Db.entities.member.scan.go();
const uniqueUsers = new Map<
  number,
  {
    id: number;
    name: string;
    email: string | undefined;
    avatarUrl: string | undefined;
  }
>();

for (const member of dynamoMembers.data) {
  if (!uniqueUsers.has(member.memberId)) {
    uniqueUsers.set(member.memberId, {
      id: member.memberId,
      name: member.name,
      email: member.email,
      avatarUrl: member.avatarUrl,
    });
  }
}

for (const user of uniqueUsers.values()) {
  try {
    await db.insert(users).values(user).onConflictDoNothing();
    stats.users.success++;
  } catch (error) {
    console.error(`  ❌ Failed to migrate user ${user.id}:`, error);
    stats.users.errors++;
  }
}
console.log(
  `  ✅ Migrated ${stats.users.success} users (${stats.users.errors} errors)\n`,
);

// 3. Migrate Organization Members
console.log("👥 Migrating Organization Members...");
for (const member of dynamoMembers.data) {
  try {
    await db
      .insert(organizationMembers)
      .values({
        orgId: member.orgId,
        userId: member.memberId,
        slackId: member.slackId,
      })
      .onConflictDoNothing();
    stats.organizationMembers.success++;
  } catch (error) {
    console.error(
      `  ❌ Failed to migrate member ${member.orgId}/${member.memberId}:`,
      error,
    );
    stats.organizationMembers.errors++;
  }
}
console.log(
  `  ✅ Migrated ${stats.organizationMembers.success} organization members (${stats.organizationMembers.errors} errors)\n`,
);

// 4. Migrate Repositories
console.log("📁 Migrating Repositories...");
const dynamoRepos = await Db.entities.repository.scan.go();
for (const repo of dynamoRepos.data) {
  try {
    await db
      .insert(repositories)
      .values({
        id: repo.repoId,
        orgId: repo.orgId,
        name: repo.name,
        avatarUrl: repo.avatarUrl,
        isEnabled: repo.isEnabled ?? true,
      })
      .onConflictDoNothing();
    stats.repositories.success++;
  } catch (error) {
    console.error(`  ❌ Failed to migrate repo ${repo.repoId}:`, error);
    stats.repositories.errors++;
  }
}
console.log(
  `  ✅ Migrated ${stats.repositories.success} repositories (${stats.repositories.errors} errors)\n`,
);

// 5. Migrate Pull Requests
console.log("🔀 Migrating Pull Requests...");
const dynamoPRs = await Db.entities.pullRequest.scan.go();
for (const pr of dynamoPRs.data) {
  try {
    await db
      .insert(pullRequests)
      .values({
        id: pr.prId,
        repoId: pr.repoId,
        prNumber: pr.prId,
        threadTs: pr.threadTs ?? undefined,
        isDraft: pr.isDraft ?? false,
        requiredApprovals: pr.requiredApprovals ?? 0,
        approvalCount: pr.approvalCount ?? 0,
        isQueuedToMerge: pr.isQueuedToMerge ?? false,
      })
      .onConflictDoNothing();
    stats.pullRequests.success++;
  } catch (error) {
    console.error(`  ❌ Failed to migrate PR ${pr.prId}:`, error);
    stats.pullRequests.errors++;
  }
}
console.log(
  `  ✅ Migrated ${stats.pullRequests.success} pull requests (${stats.pullRequests.errors} errors)\n`,
);

// 6. Migrate Branches
console.log("🌿 Migrating Branches...");
const dynamoBranches = await Db.entities.branch.scan.go();
for (const branch of dynamoBranches.data) {
  try {
    await db
      .insert(branches)
      .values({
        repoId: branch.repoId,
        name: branch.branchName,
        requiredApprovals: branch.requiredApprovals ?? 0,
      })
      .onConflictDoNothing();
    stats.branches.success++;
  } catch (error) {
    console.error(
      `  ❌ Failed to migrate branch ${branch.repoId}/${branch.branchName}:`,
      error,
    );
    stats.branches.errors++;
  }
}
console.log(
  `  ✅ Migrated ${stats.branches.success} branches (${stats.branches.errors} errors)\n`,
);

// 7. Migrate Slack Integrations
console.log("💬 Migrating Slack Integrations...");
const dynamoSlack = await Db.entities.slack.scan.go();
for (const slack of dynamoSlack.data) {
  try {
    await db
      .insert(slackIntegrations)
      .values({
        orgId: slack.orgId,
        slackTeamId: slack.slackTeamId,
        slackTeamName: slack.slackTeamName,
        accessToken: slack.accessToken,
        channelId: slack.channelId,
        channelName: slack.channelName,
      })
      .onConflictDoNothing();
    stats.slackIntegrations.success++;
  } catch (error) {
    console.error(
      `  ❌ Failed to migrate Slack integration ${slack.orgId}/${slack.slackTeamId}:`,
      error,
    );
    stats.slackIntegrations.errors++;
  }
}
console.log(
  `  ✅ Migrated ${stats.slackIntegrations.success} Slack integrations (${stats.slackIntegrations.errors} errors)\n`,
);

// 8. Migrate Subscriptions
console.log("💳 Migrating Subscriptions...");
const dynamoSubs = await Db.entities.subscription.scan.go();
for (const sub of dynamoSubs.data) {
  // Skip subscriptions without required fields
  if (!sub.orgId || !sub.priceId || !sub.status) {
    console.log(
      `  ⏭️  Skipping subscription ${sub.subId} (missing required fields: orgId=${!!sub.orgId}, priceId=${!!sub.priceId}, status=${!!sub.status})`,
    );
    stats.subscriptions.skipped++;
    continue;
  }

  try {
    await db
      .insert(subscriptions)
      .values({
        orgId: sub.orgId,
        customerId: sub.customerId ?? "",
        subscriptionId: sub.subId,
        priceId: sub.priceId,
        status: sub.status,
      })
      .onConflictDoNothing();
    stats.subscriptions.success++;
  } catch (error) {
    console.error(`  ❌ Failed to migrate subscription ${sub.subId}:`, error);
    stats.subscriptions.errors++;
  }
}
console.log(
  `  ✅ Migrated ${stats.subscriptions.success} subscriptions (${stats.subscriptions.skipped} skipped, ${stats.subscriptions.errors} errors)\n`,
);

// Print final summary
console.log("═".repeat(60));
console.log("📊 Migration Summary:");
console.log("═".repeat(60));
for (const [entity, counts] of Object.entries(stats)) {
  const total = counts.success + counts.errors + counts.skipped;
  const status = counts.errors === 0 ? "✅" : "⚠️";
  const skippedInfo = counts.skipped > 0 ? `, ${counts.skipped} skipped` : "";
  console.log(
    `${status} ${entity.padEnd(25)} ${counts.success}/${total} (${counts.errors} errors${skippedInfo})`,
  );
}
console.log("═".repeat(60));

const totalSuccess = Object.values(stats).reduce((sum, s) => sum + s.success, 0);
const totalErrors = Object.values(stats).reduce((sum, s) => sum + s.errors, 0);

if (totalErrors === 0) {
  console.log("\n🎉 Migration completed successfully!");
} else {
  console.log(
    `\n⚠️  Migration completed with ${totalErrors} errors (${totalSuccess} records migrated)`,
  );
  process.exit(1);
}
