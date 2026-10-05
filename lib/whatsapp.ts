/* =====================================================================
 * MENSAGEM DE WHATSAPP PARA O ADMINISTRADOR
 * Monta um texto organizado com todos os dados do pedido e gera o link
 * wa.me com o número comercial da JC Resolve.
 * ===================================================================== */
import { formatBRL, PROFESSIONALS, SERVICE_AREAS, SERVICE_TYPES, URGENCIES, WHATSAPP_NUMBER } from './constants';
import { formatDateBR, minToTime } from './scheduling';

export interface WhatsAppOrderData {
  code: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  items: { name: string; quantity: number; unitPrice: number }[];
  productsSubtotal: number;
  serviceValue: number;
  discount: number;
  total: number;
  address: string;
  appointment?: {
    problemDescription: string;
    serviceArea: string;
    professional: string;
    serviceType: string;
    urgency: string;
    date: string;
    startMin: number;
    endMin: number;
  } | null;
}

export function buildWhatsAppMessage(o: WhatsAppOrderData): string {
  const lines: string[] = [];
  lines.push(`*JC Resolve — Pedido ${o?.code ?? ''}*`);
  lines.push('');
  lines.push('*Cliente*');
  lines.push(`Nome: ${o?.customerName ?? '—'}`);
  lines.push(`Telefone: ${o?.customerPhone ?? '—'}`);
  lines.push(`E-mail: ${o?.customerEmail ?? '—'}`);

  const ap = o?.appointment;
  if (ap) {
    lines.push('');
    lines.push('*Serviço / Agendamento*');
    lines.push(`Problema relatado: "${ap.problemDescription}"`);
    lines.push(`Serviço: ${SERVICE_AREAS[ap.serviceArea as keyof typeof SERVICE_AREAS]?.label ?? ap.serviceArea}`);
    lines.push(`Profissional sugerido: ${PROFESSIONALS[ap.professional as keyof typeof PROFESSIONALS]?.label ?? ap.professional}`);
    lines.push(`Tipo de agendamento: ${SERVICE_TYPES[ap.serviceType as keyof typeof SERVICE_TYPES]?.label ?? ap.serviceType}`);
    lines.push(`Urgência: ${URGENCIES[ap.urgency as keyof typeof URGENCIES]?.label ?? ap.urgency}`);
    lines.push(`Data: ${formatDateBR(ap.date)}`);
    lines.push(`Horário: ${minToTime(ap.startMin)} às ${minToTime(ap.endMin)}`);
  }

  if ((o?.items?.length ?? 0) > 0) {
    lines.push('');
    lines.push('*Produtos*');
    (o?.items ?? []).forEach((it) => {
      lines.push(`- ${it?.quantity}x ${it?.name} (${formatBRL(it?.unitPrice)} cada)`);
    });
  }

  lines.push('');
  lines.push('*Valores*');
  lines.push(`Produtos: ${formatBRL(o?.productsSubtotal)}`);
  lines.push(`Serviço (valor de simulação): ${formatBRL(o?.serviceValue)}`);
  lines.push(`Desconto: ${formatBRL(o?.discount)}`);
  lines.push(`Total: ${formatBRL(o?.total)}`);
  lines.push('');
  lines.push(`*Endereço:* ${o?.address ?? '—'}`);
  lines.push('');
  lines.push(`Identificador do pedido: ${o?.code ?? ''}`);
  return lines.join('\n');
}

/** Link do WhatsApp com mensagem pré-preenchida */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Endereço em uma linha só */
export function formatAddress(a: {
  addressStreet?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  addressDistrict?: string | null;
  addressCity?: string | null;
  addressUf?: string | null;
  addressCep?: string | null;
  addressReference?: string | null;
}): string {
  const parts = [
    `${a?.addressStreet ?? ''}, ${a?.addressNumber ?? ''}${a?.addressComplement ? ` - ${a.addressComplement}` : ''}`,
    a?.addressDistrict ?? '',
    `${a?.addressCity ?? ''}/${a?.addressUf ?? ''}`,
    `CEP ${a?.addressCep ?? ''}`,
  ];
  const ref = a?.addressReference ? ` (Ref.: ${a.addressReference})` : '';
  return parts.filter((p: string) => p.trim()).join(' • ') + ref;
}
