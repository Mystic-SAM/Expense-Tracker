import { TRANSACTION_FREQUENCY, TRANSACTION_CATEGORY } from "@/constants/constants";
import z from "zod";

export const transactionFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number.",
  }),
  type: z.enum([TRANSACTION_CATEGORY.INCOME, TRANSACTION_CATEGORY.EXPENSE, TRANSACTION_CATEGORY.INVESTMENT]),
  category: z.string().min(1, { message: "Please select a category." }),
  date: z.date({
    error: "Please select a date.",
  }),
  paymentMethod: z
    .string()
    .min(1, { error: "Please select a payment method." }),
  isRecurring: z.boolean(),
  frequency: z
    .enum([
      TRANSACTION_FREQUENCY.DAILY,
      TRANSACTION_FREQUENCY.WEEKLY,
      TRANSACTION_FREQUENCY.MONTHLY,
      TRANSACTION_FREQUENCY.YEARLY,
    ])
    .nullable()
    .optional(),
  description: z.string().optional(),
});