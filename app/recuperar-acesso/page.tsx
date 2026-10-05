/* RECUPERAÇÃO DE ACESSO — SIMULADA
 * Neste protótipo não há envio automático de e-mail. O cliente é
 * orientado a falar com a JC Resolve pelo WhatsApp para redefinir a senha.
 * (Estrutura pronta para, no futuro, ligar um envio real de e-mail.) */
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { RecoverForm } from './recover-form';

export const metadata = { title: 'Recuperar acesso | JC Resolve' };

export default function RecuperarAcessoPage() {
  return (
    <div className="grid-pattern bg-navy py-14">
      <div className="container-jc max-w-md">
        <div className="card-jc p-6 sm:p-8">
          <KeyRound className="h-8 w-8 text-deep" />
          <h1 className="mt-3 font-display text-2xl font-extrabold">Recuperar acesso</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Esqueceu a senha? Informe seu e-mail e fale com a equipe para redefinir o acesso.</p>
          <RecoverForm />
          <p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-deep hover:underline">Voltar para o login</Link></p>
        </div>
      </div>
    </div>
  );
}
