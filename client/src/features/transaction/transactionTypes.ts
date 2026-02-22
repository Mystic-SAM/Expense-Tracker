import type {
  TRANSACTION_FREQUENCY,
  TransactionCategoryType,
} from "@/constants/constants";

type RecurringIntervalType =
  (typeof TRANSACTION_FREQUENCY)[keyof typeof TRANSACTION_FREQUENCY];

export interface CreateTransactionBody {
  title: string;
  type: TransactionCategoryType;
  amount: number;
  description: string;
  category: string;
  date: string;
  isRecurring: boolean;
  recurringInterval?: RecurringIntervalType | null;
  paymentMethod: string;
}

export interface TransactionType {
  _id: string;
  userId: string;
  title: string;
  type: TransactionCategoryType;
  amount: number;
  description: string;
  category: string;
  date: string;
  isRecurring: boolean;
  recurringInterval: RecurringIntervalType | null;
  nextRecurringDate: string | null;
  lastProcessed: string | null;
  status: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  id?: string;
}
