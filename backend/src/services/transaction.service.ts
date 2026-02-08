import { TransactionModel } from "../models/transaction.model.js";
import { calculateNextOccurrence } from "../utils/helper.js";
import type { CreateTransactionType } from "../validators/transaction.validator.js";
import { Logger } from "../utils/logger.js";

export const createTransactionService = async (
  body: CreateTransactionType,
  userId: string
) => {
  let nextRecurringDate: Date | undefined;
  const currentDate = new Date();

  if (body.isRecurring && body.recurringInterval) {
    const calculatedDate = calculateNextOccurrence(
      body.date,
      body.recurringInterval
    );

    nextRecurringDate =
      calculatedDate < currentDate
        ? calculateNextOccurrence(currentDate, body.recurringInterval)
        : calculatedDate;

    Logger.debug("Recurring transaction date calculated", {
      originalDate: body.date,
      calculatedDate,
      nextRecurringDate,
      interval: body.recurringInterval,
    });
  }

  const transaction = await TransactionModel.create({
    ...body,
    userId,
    category: body.category,
    amount: Number(body.amount),
    description: body.description ?? null,
    isRecurring: body.isRecurring || false,
    recurringInterval: body.recurringInterval ?? null,
    nextRecurringDate: nextRecurringDate ?? null,
    lastProcessed: null,
  });

  return transaction;
};