import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthForm mode="register" />
    </Suspense>
  );
}