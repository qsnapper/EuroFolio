import { MainNav } from './main-nav';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function DashboardLayout({ 
  children, 
  title, 
  description, 
  action 
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="container space-y-6 p-8">
        {(title || description || action) && (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {title && (
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              )}
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
            {action && <div>{action}</div>}
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
}