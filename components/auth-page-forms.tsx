'use client';

/* Wrappers das páginas /login e /cadastro: decidem para onde ir depois
 * de entrar (callbackUrl, painel admin ou Minha conta). */
import { useRouter } from 'next/navigation';
import { LoginForm, SignupForm } from './auth-forms';

function safeCallback(url?: string | null): string | null {
  // Só aceita caminhos internos (evita redirecionamento para outros sites)
  return url && url.startsWith('/') && !url.startsWith('//') ? url : null;
}

export function LoginPageForm({ callbackUrl }: { callbackUrl?: string | null }) {
  const router = useRouter();
  return (
    <LoginForm
      onSuccess={(role) => {
        router.push(safeCallback(callbackUrl) ?? (role === 'ADMIN' ? '/admin' : '/conta'));
        router.refresh();
      }}
    />
  );
}

export function SignupPageForm({ callbackUrl }: { callbackUrl?: string | null }) {
  const router = useRouter();
  return (
    <SignupForm
      onSuccess={() => {
        router.push(safeCallback(callbackUrl) ?? '/conta');
        router.refresh();
      }}
    />
  );
}
