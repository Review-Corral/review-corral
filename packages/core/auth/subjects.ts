import { createSubjects } from "@openauthjs/openauth";
import { number, object } from "valibot";

export const subjects = createSubjects({
  user: object({
    userId: number(),
  }),
});
