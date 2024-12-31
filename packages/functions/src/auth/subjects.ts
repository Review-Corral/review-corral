import { createSubjects } from "@openauthjs/openauth";
import { object, string } from "valibot";

export const subjects = createSubjects({
  user: object({
    email: string(),
  }),
});
