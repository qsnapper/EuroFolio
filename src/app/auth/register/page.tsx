import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account - EuroFolio',
  description: 'Create your free EuroFolio account and start backtesting your investment portfolios with advanced analytics.',
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthForm mode="register" />
    </Suspense>
  );
}