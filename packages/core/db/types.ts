import { InferSelectModel } from "drizzle-orm";
import { users } from "./schema";

export type User = InferSelectModel<typeof users>;
