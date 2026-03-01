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

export const chartAnalyticsService = async (
  userId: string,
  dateRangePreset?: DateRangePreset,
  customFrom?: Date,
  customTo?: Date,
) => {
  const range = getDateRange(dateRangePreset, customFrom, customTo);
  const { from, to, value: rangeValue } = range;

  const filter: any = {
    userId: new mongoose.Types.ObjectId(userId),
    ...(from &&
      to && {
        date: {
          $gte: from,
          $lte: to,
        },
      }),
  };

  const result = await TransactionModel.aggregate([
    { $match: filter },
    //Group the transaction by date (YYYY-MM-DD)
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$date",
          },
        },

        income: {
          $sum: {
            $cond: [
              { $eq: ["$type", TransactionTypeEnum.INCOME] },
              { $abs: "$amount" },
              0,
            ],
          },
        },

        expenses: {
          $sum: {
            $cond: [
              { $eq: ["$type", TransactionTypeEnum.EXPENSE] },
              { $abs: "$amount" },
              0,
            ],
          },
        },

        investment: {
          $sum: {
            $cond: [
              { $eq: ["$type", TransactionTypeEnum.INVESTMENT] },
              { $abs: "$amount" },
              0,
            ],
          },
        },

        incomeCount: {
          $sum: {
            $cond: [{ $eq: ["$type", TransactionTypeEnum.INCOME] }, 1, 0],
          },
        },

        expenseCount: {
          $sum: {
            $cond: [{ $eq: ["$type", TransactionTypeEnum.EXPENSE] }, 1, 0],
          },
        },

        investmentCount: {
          $sum: {
            $cond: [{ $eq: ["$type", TransactionTypeEnum.INVESTMENT] }, 1, 0],
          },
        },
      },
    },

    { $sort: { _id: 1 } },

    {
      $project: {
        _id: 0,
        date: "$_id",
        income: 1,
        expenses: 1,
        investment: 1,
        incomeCount: 1,
        expenseCount: 1,
        investmentCount: 1,
      },
    },

    {
      $group: {
        _id: null,
        chartData: { $push: "$$ROOT" },
        totalIncomeCount: { $sum: "$incomeCount" },
        totalExpenseCount: { $sum: "$expenseCount" },
        totalInvestmentCount: { $sum: "$investmentCount" },
      },
    },

    {
      $project: {
        _id: 0,
        chartData: 1,
        totalIncomeCount: 1,
        totalExpenseCount: 1,
        totalInvestmentCount: 1,
      },
    },
  ]);

  const resultData = result[0] || {};

  const transaformedData = (resultData?.chartData || []).map((item: any) => ({
    date: item.date,
    income: convertToINR(item.income),
    expenses: convertToINR(item.expenses),
    investment: convertToINR(item.investment),
  }));

  return {
    chartData: transaformedData,
    totalIncomeCount: resultData.totalIncomeCount,
    totalExpenseCount: resultData.totalExpenseCount,
    totalInvestmentCount: resultData.totalInvestmentCount,
    preset: {
      ...range,
      value: rangeValue || DateRangeEnum.ALL_TIME,
      label: range?.label || "All Time",
    },
  };
};

export const expensePieChartBreakdownService = async (
  userId: string,
  dateRangePreset?: DateRangePreset,
  customFrom?: Date,
  customTo?: Date,
) => {
  const range = getDateRange(dateRangePreset, customFrom, customTo);
  const { from, to, value: rangeValue } = range;

  const filter: any = {
    userId: new mongoose.Types.ObjectId(userId),
    type: TransactionTypeEnum.EXPENSE,
    ...(from &&
      to && {
        date: {
          $gte: from,
          $lte: to,
        },
      }),
  };

  const pipleline: PipelineStage[] = [
    {
      $match: filter,
    },
    {
      $group: {
        _id: "$category",
        value: { $sum: { $abs: "$amount" } },
      },
    },
    { $sort: { value: -1 } }, //

    {
      $facet: {
        topThree: [{ $limit: 3 }],
        others: [
          { $skip: 3 },
          {
            $group: {
              _id: "others",
              value: { $sum: "$value" },
            },
          },
        ],
      },
    },

    {
      $project: {
        categories: {
          $concatArrays: ["$topThree", "$others"],
        },
      },
    },

    { $unwind: "$categories" },

    {
      $group: {
        _id: null,
        totalSpent: { $sum: "$categories.value" },
        breakdown: { $push: "$categories" },
      },
    },

    {
      $project: {
        _id: 0,
        totalSpent: 1,
        breakdown: {
          // .map((cat: any)=> )
          $map: {
            input: "$breakdown",
            as: "cat",
            in: {
              name: "$$cat._id",
              value: "$$cat.value",
              percentage: {
                $cond: [
                  { $eq: ["$totalSpent", 0] },
                  0,
                  {
                    $round: [
                      {
                        $multiply: [
                          { $divide: ["$$cat.value", "$totalSpent"] },
                          100,
                        ],
                      },
                      0,
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

  const result = await TransactionModel.aggregate(pipleline);

  const data = result[0] || {
    totalSpent: 0,
    breakdown: [],
  };
  const transformedData = {
    totalSpent: convertToINR(data.totalSpent),
    breakdown: data.breakdown.map((item: any) => ({
      ...item,
      value: convertToINR(item.value),
    })),
  };

  return {
    ...transformedData,
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
