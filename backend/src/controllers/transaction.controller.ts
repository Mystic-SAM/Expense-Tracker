import { HTTP_STATUS } from "../config/http.config.js";
import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import type { Request, Response } from "express";
import { createTransactionSchema } from "../validators/transaction.validator.js";
import { createTransactionService } from "../services/transaction.service.js";
import { Logger } from "../utils/logger.js";

export const createTransactionController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = createTransactionSchema.parse(req.body);
    const userId = req.user?._id;

    const transaction = await createTransactionService(body, userId);

    Logger.info("Transaction created successfully", {
      transactionId: transaction._id,
      userId,
      type: body.type,
      amount: body.amount,
    });

    return res.status(HTTP_STATUS.CREATED).json({
      message: "Transaction created successfully",
      transaction,
    });
  }
);