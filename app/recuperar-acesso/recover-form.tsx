'use client';

import { useState } from 'react';
import { Mail, MessageCircle, Send } from 'lucide-react';
import { whatsappLink } from '@/lib/whatsapp';

/** Formulário simulado: não envia e-mail, apenas prepara o contato via WhatsApp */
export function RecoverForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const valid = /\S+@\S+\.\S+/.test(email);

  if (sent) {
    return (
      <div className="space-y-4">
        <p role="status" className="rounded-lg bg-muted p-4 text-sm">
          <span className="badge-sim mb-2">Simulação</span><br />
          Nesta versão do site, a redefinição de senha é feita pela equipe da JC Resolve. Clique abaixo para enviar a solicitação pelo WhatsApp.
        </p>
        <a
          href={whatsappLink(`Olá, JC Resolve! Preciso recuperar o acesso à minha conta no site. E-mail cadastrado: ${email}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground hover:brightness-95"
        >
          <MessageCircle className="h-4 w-4" /> Solicitar pelo WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (valid) setSent(true); }} className="space-y-4" noValidate>
      <div>
        <label htmlFor="rec-email" className="field-label">E-mail cadastrado</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input id="rec-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="voce@email.com" className="field pl-10" required />
        </div>
      </div>
      <button type="submit" disabled={!valid} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground hover:brightness-95 disabled:opacity-50">
        <Send className="h-4 w-4" /> Continuar
      </button>
    </form>
  );
}
