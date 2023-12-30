import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { organizations, users } from "./schema";

export type User = InferSelectModel<typeof users>;

export type Organization = InferSelectModel<typeof organizations>;
export type OrganizationInsertArgs = InferInsertModel<typeof organizations>;
