import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthForm mode="login" />
    </Suspense>
  );
}