import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { auth } from '@/auth';
import { LoginPageForm } from '@/components/auth-page-forms';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Entrar | JC Resolve' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  const session = await auth();
  // Quem já está logado vai direto para a área logada
  if (session?.user?.id) redirect(session.user.role === 'ADMIN' ? '/admin' : '/conta');

  return (
    <div className="grid-pattern bg-navy py-14">
      <div className="container-jc max-w-md">
        <div className="card-jc p-6 sm:p-8">
          <LogIn className="h-8 w-8 text-deep" />
          <h1 className="mt-3 font-display text-2xl font-extrabold">Entrar na sua conta</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Acompanhe pedidos e agendamentos da JC Resolve.</p>
          <LoginPageForm callbackUrl={callbackUrl ?? null} />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não tem conta?{' '}
            <Link href={callbackUrl ? `/cadastro?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/cadastro'} className="font-semibold text-deep hover:underline">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
