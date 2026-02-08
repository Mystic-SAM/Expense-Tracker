import { Router } from "express";
import { createTransactionController, duplicateTransactionController, getAllTransactionController, getTransactionByIdController, updateTransactionController } from "../controllers/transaction.controller.js";

const transactionRoutes = Router();

transactionRoutes.post("/create", createTransactionController);

transactionRoutes.put("/duplicate/:id", duplicateTransactionController);
transactionRoutes.put("/update/:id", updateTransactionController);

transactionRoutes.get("/all", getAllTransactionController);
transactionRoutes.get("/:id", getTransactionByIdController);

export default transactionRoutes;