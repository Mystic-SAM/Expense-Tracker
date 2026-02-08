import { Router } from "express";
import { createTransactionController } from "../controllers/transaction.controller.js";

const transactionRoutes = Router();

transactionRoutes.post("/create", createTransactionController);

export default transactionRoutes;