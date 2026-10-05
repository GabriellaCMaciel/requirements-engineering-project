import { MessageCircle } from 'lucide-react';
import { whatsappLink } from '@/lib/whatsapp';

/** Botão flutuante de WhatsApp, visível em todas as páginas */
export function WhatsAppFloat() {
  return (
    <a
      href={whatsappLink('Olá, JC Resolve! Gostaria de atendimento.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a JC Resolve pelo WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
