import PageLayout from "@/components/PageLayout";
import DashboardRecentTransactions from "./DashboardRecentTransactions";
import { useState } from "react";
import type { DateRangeType } from "@/components/DateRangeSelect";
import DashboardSummary from "./DashboardSummary";

const Dashboard = () => {
  const [dateRange, setDateRange] = useState<DateRangeType>(null);

  return (
    <div className="w-full flex flex-col">
      {/* Dashboard Summary Overview */}
      <PageLayout className="space-y-6"
        renderPageHeader={<DashboardSummary dateRange={dateRange} setDateRange={setDateRange} />}
      >
        {/* Dashboard Recent Transactions */}
        <div className="w-full mt-0">
          <DashboardRecentTransactions />
        </div>
      </PageLayout>
    </div>
  );
};

export default Dashboard;