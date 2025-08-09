import { MainNav } from '@/components/layout/main-nav';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}