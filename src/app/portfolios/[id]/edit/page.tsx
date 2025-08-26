import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EditPortfolioForm } from '@/components/portfolios/edit-portfolio-form';
import { Loader2 } from 'lucide-react';

interface EditPortfolioPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPortfolioPage({ params }: EditPortfolioPageProps) {
  const { id } = await params;

  return (
    <DashboardLayout
      title="Edit Portfolio"
      description="Modify your portfolio settings and allocations"
    >
      <div className="max-w-4xl mx-auto">
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }>
          <EditPortfolioForm portfolioId={id} />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}