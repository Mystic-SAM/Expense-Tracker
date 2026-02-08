import { addDays, addMonths, addWeeks, addYears, startOfMonth } from "date-fns";
import { RecurringIntervalEnum, type RecurringInterval } from "../enums/model-enums.js";

export function calculateNextReportDate(lastSentDate?: Date): Date {
  const baseDate = lastSentDate ?? new Date();
  const nextDate = startOfMonth(addMonths(baseDate, 1));
  nextDate.setUTCHours(0, 0, 0, 0);
  return nextDate;
}

export function calculateNextOccurrence(
  date: Date,
  recurringInterval: RecurringInterval
): Date {
  const base = new Date(date);
  base.setUTCHours(0, 0, 0, 0);

  switch (recurringInterval) {
    case RecurringIntervalEnum.DAILY:
      return addDays(base, 1);
    case RecurringIntervalEnum.WEEKLY:
      return addWeeks(base, 1);
    case RecurringIntervalEnum.MONTHLY:
      return addMonths(base, 1);
    case RecurringIntervalEnum.YEARLY:
      return addYears(base, 1);
    default:
      return base;
  }
}

export function calculateNextEffectiveDate(
  startDate: Date,
  interval: RecurringInterval
): Date {
  const now = new Date();
  const calculatedDate = calculateNextOccurrence(startDate, interval);

  const nextRecurringDate =
    calculatedDate < now
      ? calculateNextOccurrence(now, interval)
      : calculatedDate;

  return nextRecurringDate;
}