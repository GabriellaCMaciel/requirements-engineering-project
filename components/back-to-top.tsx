'use client';

/* =====================================================================
 * BOTÃO "VOLTAR AO TOPO"
 * - Fica no rodapé (presente em todas as páginas).
 * - Rola a janela suavemente até o início da página ao ser clicado.
 * - Usa window.scrollTo com behavior 'smooth' para uma rolagem agradável.
 * ===================================================================== */
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  // Função chamada no clique: leva o usuário ao topo da página.
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Voltar ao topo da página"
      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:brightness-95 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <ArrowUp className="h-4 w-4" /> Voltar ao topo
    </button>
  );
}
