import { createSubjects } from "@openauthjs/openauth";
import { object, number } from "valibot";

export const subjects = createSubjects({
  user: object({
    userId: number(),
  }),
});
