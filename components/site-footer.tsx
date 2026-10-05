import Link from 'next/link';
import { MapPin, MessageCircle } from 'lucide-react';
import { Logo } from './logo';
import { BackToTop } from './back-to-top';
import { SERVICE_REGION, WHATSAPP_DISPLAY } from '@/lib/constants';
import { whatsappLink } from '@/lib/whatsapp';

/* Rodapé + seção de contato (somente os canais informados no briefing) */
export function SiteFooter() {
  return (
    <footer className="bg-navy text-white">
      {/* Faixa com o botão "Voltar ao topo" — presente em todas as páginas */}
      <div className="border-b border-white/10">
        <div className="container-jc flex justify-center py-5 sm:justify-end">
          <BackToTop />
        </div>
      </div>
      <div className="container-jc grid gap-10 py-12 md:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-white/70">JC Resolve: Manutenção sem dor de cabeça.</p>
        </div>
        <div className="space-y-3">
          <h2 className="text-base font-bold">Contato</h2>
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-white/80 hover:text-primary">
            <MessageCircle className="h-4 w-4 text-primary" /> <span suppressHydrationWarning>WhatsApp {WHATSAPP_DISPLAY}</span>
          </a>
          <p className="flex items-center gap-2 text-sm text-white/80">
            <MapPin className="h-4 w-4 text-primary" /> Atendimento em {SERVICE_REGION}
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-base font-bold">Navegação</h2>
          <div className="flex flex-col gap-2 text-sm text-white/80">
            <Link href="/servicos" className="hover:text-primary">Serviços</Link>
            <Link href="/loja" className="hover:text-primary">Loja / Produtos</Link>
            <Link href="/conta" className="hover:text-primary">Minha conta</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="container-jc py-4 text-xs text-white/50">
          Protótipo de demonstração — projeto integrado Desenvolvimento Web e Marketing (EFG). Produtos, preços e valores de serviço são simulações.
        </p>
      </div>
    </footer>
  );
}
