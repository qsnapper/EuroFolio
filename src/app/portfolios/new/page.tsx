import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { CreatePortfolioForm } from '@/components/portfolios/create-portfolio-form';

export default function CreatePortfolioPage() {
  return (
    <DashboardLayout
      title="Create New Portfolio"
      description="Design and backtest your investment strategy"
    >
      <div className="max-w-4xl mx-auto">
        <CreatePortfolioForm />
      </div>
    </DashboardLayout>
  );
}