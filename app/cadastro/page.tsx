import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { auth } from '@/auth';
import { SignupPageForm } from '@/components/auth-page-forms';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Criar conta | JC Resolve' };

export default async function CadastroPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  const session = await auth();
  if (session?.user?.id) redirect(session.user.role === 'ADMIN' ? '/admin' : '/conta');

  return (
    <div className="grid-pattern bg-navy py-14">
      <div className="container-jc max-w-lg">
        <div className="card-jc p-6 sm:p-8">
          <UserPlus className="h-8 w-8 text-deep" />
          <h1 className="mt-3 font-display text-2xl font-extrabold">Criar conta</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Cadastro rápido para pedir serviços e produtos.</p>
          <SignupPageForm callbackUrl={callbackUrl ?? null} />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta? <Link href="/login" className="font-semibold text-deep hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
