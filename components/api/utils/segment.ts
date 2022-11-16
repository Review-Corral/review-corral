import Analytics from "analytics-node";

export const analytics = new Analytics(process.env.NEXT_PUBLIC_SEGMENT_KEY!);
