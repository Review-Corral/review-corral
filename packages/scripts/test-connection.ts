import { Db } from "../domain/dynamodb/client";
import { db } from "../domain/postgres/client";
import { organizations } from "../domain/postgres/schema";

console.log("🔍 Testing database connections...\n");

// Test DynamoDB connection
console.log("📦 DynamoDB: Fetching organizations...");
const dynamoOrgs = await Db.entities.organization.scan.go({ limit: 5 });
console.log(`✅ Found ${dynamoOrgs.data.length} organizations in DynamoDB`);
if (dynamoOrgs.data.length > 0) {
  console.log("   Example org:", {
    orgId: dynamoOrgs.data[0].orgId,
    name: dynamoOrgs.data[0].name,
  });
}

// Test Postgres connection
console.log("\n🐘 Postgres: Fetching organizations...");
const pgOrgs = await db.select().from(organizations).limit(5);
console.log(`✅ Found ${pgOrgs.length} organizations in Postgres`);
if (pgOrgs.length > 0) {
  console.log("   Example org:", {
    id: pgOrgs[0].id,
    name: pgOrgs[0].name,
  });
}

console.log("\n✨ Both database connections working!");
