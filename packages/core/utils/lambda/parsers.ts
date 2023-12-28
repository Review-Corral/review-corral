import * as z from "zod";

/**
 * Standard message structure
 */
export const messageDataSchema = z.object({ message: z.string() });
