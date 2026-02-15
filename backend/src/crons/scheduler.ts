import cron from "node-cron";
import { processRecurringTransactions } from "./jobs/transaction.job.js";
import { Logger } from "../utils/logger.js";

const scheduleJob = (name: string, time: string, job: Function) => {
  Logger.info("Scheduling cron job", { jobName: name, schedule: time });

  return cron.schedule(
    time,
    async () => {
      try {
        await job();
        Logger.info("Cron job completed successfully", { jobName: name });
      } catch (error) {
        Logger.error("Cron job failed", error, { jobName: name });
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
};

export const startJobs = () => {
  return [
    scheduleJob("Transactions", "5 0 * * *", processRecurringTransactions),

    //run 2:30am every first of the month
    // scheduleJob("Reports", "30 2 1 * *", processReportJob),
  ];
};