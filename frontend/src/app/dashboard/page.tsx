// src/app/dashboard/page.tsx
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

const DashboardPage = () => {
  return (
    <div className="container mx-auto py-6">
      <DashboardOverview />
    </div>
  );
};

export default DashboardPage;
