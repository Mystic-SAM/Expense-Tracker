import type { PipelineStage } from "mongoose";
import {
  DateRangeEnum,
  type DateRangePreset,
} from "../enums/date-range.enum.js";
import mongoose from "mongoose";
import { TransactionTypeEnum } from "../enums/model-enums.js";
import { TransactionModel } from "../models/transaction.model.js";
import { convertToINR } from "../utils/currency.js";
import { differenceInDays, subDays, subYears } from "date-fns";
import { getDateRange } from "../utils/date.js";

export const summaryAnalyticsService = async (
  userId: string,
  dateRangePreset?: DateRangePreset,
  customFrom?: Date,
  customTo?: Date,
) => {
  const range = getDateRange(dateRangePreset, customFrom, customTo);

  const { from, to, value: rangeValue } = range;

  const currentPeriodPipeline: PipelineStage[] = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        ...(from &&
          to && {
            date: {
              $gte: from,
              $lte: to,
            },
          }),
      },
    },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: {
            $cond: [
              { $eq: ["$type", TransactionTypeEnum.INCOME] },
              { $abs: "$amount" },
              0,
            ],
          },
        },
        totalExpenses: {
          $sum: {
            $cond: [
              { $eq: ["$type", TransactionTypeEnum.EXPENSE] },
              { $abs: "$amount" },
              0,
            ],
          },
        },
        totalInvestment: {
          $sum: {
            $cond: [
              { $eq: ["$type", TransactionTypeEnum.INVESTMENT] },
              { $abs: "$amount" },
              0,
            ],
          },
        },

        transactionCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        totalIncome: 1,
        totalExpenses: 1,
        totalInvestment: 1,
        transactionCount: 1,

        // Available Balance = income - (expenses + investment)
        availableBalance: {
          $subtract: [
            { $ifNull: ["$totalIncome", 0] },
            {
              $add: [
                { $ifNull: ["$totalExpenses", 0] },
                { $ifNull: ["$totalInvestment", 0] },
              ],
            },
          ],
        },

        savingData: {
          $let: {
            vars: {
              income: { $ifNull: ["$totalIncome", 0] },
              expenses: { $ifNull: ["$totalExpenses", 0] },
              investment: { $ifNull: ["$totalInvestment", 0] },
            },
            in: {
              // Savings Percentage = ((income - (expenses + investment)) / income) * 100
              savingsPercentage: {
                $cond: [
                  { $lte: ["$$income", 0] },
                  0,
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $subtract: [
                              "$$income",
                              { $add: ["$$expenses", "$$investment"] },
                            ],
                          },
                          "$$income",
                        ],
                      },
                      100,
                    ],
                  },
                ],
              },

              // Expense Ratio = (expenses / income) * 100
              expenseRatio: {
                $cond: [
                  { $lte: ["$$income", 0] },
                  0,
                  {
                    $multiply: [
                      {
                        $divide: ["$$expenses", "$$income"],
                      },
                      100,
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    },
  ];

  const [current] = await TransactionModel.aggregate(currentPeriodPipeline);

  const {
    totalIncome = 0,
    totalExpenses = 0,
    totalInvestment = 0,
    availableBalance = 0,
    transactionCount = 0,
    savingData = {
      expenseRatio: 0,
      savingsPercentage: 0,
    },
  } = current || {};

  console.log(current, "current");

  let percentageChange: any = {
    income: 0,
    expenses: 0,
    investmnet: 0,
    balance: 0,
    prevPeriodFrom: null,
    prevPeriodTo: null,
    previousValues: {
      incomeAmount: 0,
      expenseAmount: 0,
      investmentAmount: 0,
      balanceAmount: 0,
    },
  };

  if (from && to && rangeValue !== DateRangeEnum.ALL_TIME) {
    const period = differenceInDays(to, from) + 1;
    console.log(`${differenceInDays(to, from)}`, period, "period");

    const isYearly = [
      DateRangeEnum.LAST_YEAR,
      DateRangeEnum.THIS_YEAR,
    ].includes(rangeValue);

    const prevPeriodFrom = isYearly ? subYears(from, 1) : subDays(from, period);

    const prevPeriodTo = isYearly ? subYears(to, 1) : subDays(to, period);
    console.log(prevPeriodFrom, prevPeriodTo, "Prev date");

    const prevPeriodPipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: {
            $gte: prevPeriodFrom,
            $lte: prevPeriodTo,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [
                { $eq: ["$type", TransactionTypeEnum.INCOME] },
                { $abs: "$amount" },
                0,
              ],
            },
          },
          totalExpenses: {
            $sum: {
              $cond: [
                { $eq: ["$type", TransactionTypeEnum.EXPENSE] },
                { $abs: "$amount" },
                0,
              ],
            },
          },
          totalInvestment: {
            $sum: {
              $cond: [
                { $eq: ["$type", TransactionTypeEnum.INVESTMENT] },
                { $abs: "$amount" },
                0,
              ],
            },
          },
        },
      },
    ];

    const [previous] = await TransactionModel.aggregate(prevPeriodPipeline);

    console.log(previous, "Prvious Data");
    if (previous) {
      const prevIncome = previous.totalIncome || 0;
      const prevExpenses = previous.totalExpenses || 0;
      const prevInvestment = previous.totalInvestment || 0;
      const prevBalance = prevIncome - (prevExpenses + prevInvestment);

      const currentIncome = totalIncome;
      const currentExpenses = totalExpenses;
      const currentInvestment = totalInvestment;
      const currentBalance = availableBalance;

      percentageChange = {
        income: calaulatePercentageChange(prevIncome, currentIncome),
        expenses: calaulatePercentageChange(prevExpenses, currentExpenses),
        investment: calaulatePercentageChange(
          prevInvestment,
          currentInvestment,
        ),
        balance: calaulatePercentageChange(prevBalance, currentBalance),
        prevPeriodFrom: prevPeriodFrom,
        prevPeriodTo: prevPeriodTo,
        previousValues: {
          incomeAmount: prevIncome,
          expenseAmount: prevExpenses,
          investmentAmount: prevInvestment,
          balanceAmount: prevBalance,
        },
      };
    }
  }

  return {
    availableBalance: convertToINR(availableBalance),
    totalIncome: convertToINR(totalIncome),
    totalExpenses: convertToINR(totalExpenses),
    totalInvestment: convertToINR(totalInvestment),
    savingRate: {
      percentage: parseFloat(savingData.savingsPercentage.toFixed(2)),
      expenseRatio: parseFloat(savingData.expenseRatio.toFixed(2)),
    },
    transactionCount,
    percentageChange: {
      ...percentageChange,
      previousValues: {
        incomeAmount: convertToINR(
          percentageChange.previousValues.incomeAmount,
        ),
        expenseAmount: convertToINR(
          percentageChange.previousValues.expenseAmount,
        ),
        investmentAmount: convertToINR(
          percentageChange.previousValues.investmentAmount,
        ),
        balanceAmount: convertToINR(
          percentageChange.previousValues.balanceAmount,
        ),
      },
    },
    preset: {
      ...range,
      value: rangeValue || DateRangeEnum.ALL_TIME,
      label: range?.label || "All Time",
    },
  };
};

function calaulatePercentageChange(previous: number, current: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  const changes = ((current - previous) / Math.abs(previous)) * 100;
  const cappedChange = Math.min(Math.max(changes, -100), 100);
  return parseFloat(cappedChange.toFixed(2));
}
