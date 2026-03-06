
export interface FilterParams {
  preset?: string;
  from?: string;
  to?: string;
}

interface PercentageChange {
  income: number;
  expenses: number;
  investment: number;
  balance: number;
  prevPeriodFrom: string | null;
  prevPeriodTo: string | null;
}

interface PresetType {
  from: string;
  to: string;
  value: string;
  label: string;
}

export interface SummaryAnalyticsResponse {
  message: string;
  data: {
    availableBalance: number;
    totalIncome: number;
    totalExpenses: number;
    totalInvestment: number;
    transactionCount: number;
    savingRate: {
      percentage: number;
      expenseRatio: number;
    };
    percentageChange: PercentageChange;
    preset: PresetType;
  }
}
