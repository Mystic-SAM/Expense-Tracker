import { TransactionModel } from "../models/transaction.model.js";
import {
  calculateNextEffectiveDate,
} from "../utils/helper.js";
import type { CreateTransactionType, UpdateTransactionType } from "../validators/transaction.validator.js";
import { Logger } from "../utils/logger.js";
import { RecurringStatusEnum, type RecurringStatus, type TransactionType } from "../enums/model-enums.js";
import { NotFoundException } from "../utils/app-error.js";

export const createTransactionService = async (
  body: CreateTransactionType,
  userId: string
) => {
  let nextRecurringDate: Date | undefined;

  if (body.isRecurring && body.recurringInterval) {
    nextRecurringDate = calculateNextEffectiveDate(
      body.date,
      body.recurringInterval
    );

    Logger.debug("Recurring transaction date calculated", {
      originalDate: body.date,
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

  Logger.info("Transaction created successfully", {
    transactionId: transaction._id,
  });

  return transaction;
};

export const getAllTransactionService = async (
  userId: string,
  filters: {
    keyword?: string | undefined;
    type?: TransactionType | undefined;
    recurringStatus?: RecurringStatus | undefined;
  },
  pagination: {
    pageSize: number;
    pageNumber: number;
  }
) => {
  const { keyword, type, recurringStatus } = filters;

  const filterConditions: Record<string, any> = {
    userId,
  };

  if (keyword) {
    filterConditions.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { category: { $regex: keyword, $options: "i" } },
    ];
  }

  if (type) {
    filterConditions.type = type;
  }

  if (recurringStatus) {
    if (recurringStatus === RecurringStatusEnum.RECURRING) {
      filterConditions.isRecurring = true;
    } else if (recurringStatus === RecurringStatusEnum.NON_RECURRING) {
      filterConditions.isRecurring = false;
    }
  }

  const { pageSize, pageNumber } = pagination;
  const skip = (pageNumber - 1) * pageSize;

  const [transactions, totalCount] = await Promise.all([
    TransactionModel.find(filterConditions)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 }),
    TransactionModel.countDocuments(filterConditions),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    transactions,
    pagination: {
      pageSize,
      pageNumber,
      totalCount,
      totalPages,
      skip,
    },
  };
};

export const getTransactionByIdService = async (
  userId: string,
  transactionId: string
) => {
  const transaction = await TransactionModel.findOne({
    _id: transactionId,
    userId,
  });
  if (!transaction) throw new NotFoundException("Transaction not found");

  return transaction;
};

export const duplicateTransactionService = async (
  userId: string,
  transactionId: string
) => {
  const transaction = await TransactionModel.findOne({
    _id: transactionId,
    userId,
  });
  if (!transaction) throw new NotFoundException("Transaction not found");

  const {
    _id,
    createdAt,
    updatedAt,
    recurringInterval,
    nextRecurringDate,
    lastProcessed,
    ...transactionData
  } = transaction.toObject();

  const duplicated = await TransactionModel.create({
    ...transactionData,
    title: `Duplicate - ${transaction.title}`,
    isRecurring: false,
    date: new Date(),
  });

  Logger.info("Transaction duplicated successfully", {
    originalTransactionId: transactionId,
    newTransactionId: duplicated._id,
  });

  return duplicated;
};

export const updateTransactionService = async (
  userId: string,
  transactionId: string,
  body: UpdateTransactionType
) => {
  const existingTransaction = await TransactionModel.findOne({
    _id: transactionId,
    userId,
  });
  if (!existingTransaction)
    throw new NotFoundException("Transaction not found");

  const isRecurring = body.isRecurring ?? existingTransaction.isRecurring;

  const date =
    body.date !== undefined ? new Date(body.date) : existingTransaction.date;

  const recurringInterval =
    body.recurringInterval || existingTransaction.recurringInterval;

  let nextRecurringDate: Date | undefined;

  if (isRecurring && recurringInterval) {
    nextRecurringDate = calculateNextEffectiveDate(date, recurringInterval);
    Logger.debug("Recurring settings updated for transaction", {
      transactionId,
      nextRecurringDate,
    });
  }

  existingTransaction.set({
    ...(body.title && { title: body.title }),
    ...(body.description && { description: body.description }),
    ...(body.category && { category: body.category }),
    ...(body.type && { type: body.type }),
    ...(body.paymentMethod && { paymentMethod: body.paymentMethod }),
    ...(body.amount !== undefined && { amount: Number(body.amount) }),
    date,
    isRecurring,
    recurringInterval,
    nextRecurringDate,
  });

  await existingTransaction.save();

  Logger.info("Transaction updated successfully", {
    transactionId,
  });

  return;
};