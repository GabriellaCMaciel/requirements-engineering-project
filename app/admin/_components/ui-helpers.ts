/* Cores e estilos compartilhados pelo painel */

/** Cor de cada profissional (agenda, gráficos e legendas) */
export const PRO_COLORS: Record<string, { chip: string; bar: string; dot: string }> = {
  GERAL: { chip: 'bg-amber-100 text-amber-900 border-l-4 border-amber-500', bar: '#FF9149', dot: 'bg-amber-500' },
  HIDRAULICA: { chip: 'bg-sky-100 text-sky-900 border-l-4 border-sky-500', bar: '#60B5FF', dot: 'bg-sky-500' },
  ELETRICISTA: { chip: 'bg-lime-100 text-lime-900 border-l-4 border-lime-600', bar: '#72BF78', dot: 'bg-lime-600' },
  REFRIGERACAO: { chip: 'bg-violet-100 text-violet-900 border-l-4 border-violet-500', bar: '#A19AD3', dot: 'bg-violet-500' },
};

export const APPT_STATUS_STYLE: Record<string, string> = {
  AGENDADO: 'bg-amber-100 text-amber-800',
  CONFIRMADO: 'bg-sky-100 text-sky-800',
  EM_ATENDIMENTO: 'bg-violet-100 text-violet-800',
  CONCLUIDO: 'bg-emerald-100 text-emerald-800',
  CANCELADO: 'bg-slate-200 text-slate-600',
};

export const ORDER_STATUS_STYLE: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: 'bg-amber-100 text-amber-800',
  PAGAMENTO_CONFIRMADO: 'bg-sky-100 text-sky-800',
  EM_PREPARACAO: 'bg-violet-100 text-violet-800',
  ENVIADO: 'bg-indigo-100 text-indigo-800',
  ENTREGUE: 'bg-emerald-100 text-emerald-800',
  CANCELADO: 'bg-slate-200 text-slate-600',
};

/** Link de WhatsApp para falar com o CLIENTE (número brasileiro) */
export function customerWhatsApp(phone?: string | null, text?: string): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  const full = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
