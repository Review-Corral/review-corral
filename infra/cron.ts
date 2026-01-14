import { table } from "./storage";

// PR Reminder CRON job
// Runs every weekday (Mon-Fri) at 9am ET (14:00 UTC)
new sst.aws.Cron("PrReminderCron", {
  schedule: "cron(0 14 ? * MON-FRI *)",
  job: {
    handler: "packages/functions/src/cron/prReminders.handler",
    link: [table],
  },
});
