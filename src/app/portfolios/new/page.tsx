import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { CreatePortfolioForm } from '@/components/portfolios/create-portfolio-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create New Portfolio - EuroFolio',
  description: 'Create a new investment portfolio and define your asset allocation strategy for backtesting and analysis.',
};

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