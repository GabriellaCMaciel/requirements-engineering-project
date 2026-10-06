/* =====================================================================
 * CONSTANTES DE NEGÓCIO DA JC RESOLVE
 * Tudo que pode mudar com frequência (valores, horários, contatos)
 * fica centralizado aqui para facilitar a manutenção.
 * ===================================================================== */

/** WhatsApp comercial (somente dígitos, com DDI 55) */
export const WHATSAPP_NUMBER = '5561996089673';
export const WHATSAPP_DISPLAY = '+55 61 99608-9673';

/**
 * LINK DO PAGBANK — PLACEHOLDER / DEMONSTRATIVO.
 * O link real deve ser fornecido pelo proprietário da JC Resolve.
 * Não existe integração de API real com o PagBank neste protótipo.
 */
export const PAGBANK_LINK = 'https://pagbank.com.br/';

/** Instagram profissional da JC Resolve */
export const INSTAGRAM_URL = 'https://www.instagram.com/jcresolve.valparaiso/';
export const INSTAGRAM_HANDLE = '@jcresolve.valparaiso';

/** Área de atendimento informada no briefing */
export const SERVICE_REGION = 'Valparaíso de Goiás e região';

/* ---------- Áreas de serviço oferecidas ---------- */
export type ServiceArea = 'ELETRICA' | 'HIDRAULICA' | 'REFRIGERACAO' | 'REPAROS' | 'INSTALACOES';

export const SERVICE_AREAS: Record<ServiceArea, { label: string; short: string; image: string; description: string }> = {
  ELETRICA: {
    label: 'Elétrica',
    short: 'Tomadas, lâmpadas, disjuntores e fiação.',
    image: '/images/eletrica.jpg',
    description: 'Troca de lâmpadas, tomadas, interruptores, disjuntores e reparos na parte elétrica da casa.',
  },
  HIDRAULICA: {
    label: 'Hidráulica',
    short: 'Vazamentos, torneiras, pias e descargas.',
    image: '/images/hidraulica.jpg',
    description: 'Vazamentos, torneiras, sifões, chuveiros, descargas e demais reparos hidráulicos.',
  },
  REFRIGERACAO: {
    label: 'Refrigeração',
    short: 'Ar-condicionado e climatização.',
    image: '/images/refrigeracao.jpg',
    description: 'Manutenção e reparos em ar-condicionado e equipamentos de climatização.',
  },
  REPAROS: {
    label: 'Reparos gerais',
    short: 'Pequenos consertos do dia a dia.',
    image: '/images/reparos.jpg',
    description: 'Pequenos consertos e ajustes que deixam a casa funcionando sem dor de cabeça.',
  },
  INSTALACOES: {
    label: 'Instalações',
    short: 'Suportes, prateleiras e acessórios.',
    image: '/images/instalacoes.jpg',
    description: 'Instalação de suportes, prateleiras, luminárias, acessórios e itens em geral.',
  },
};

/* ---------- Os 4 profissionais (agendas independentes) ---------- */
export type Professional = 'GERAL' | 'HIDRAULICA' | 'ELETRICISTA' | 'REFRIGERACAO';

export const PROFESSIONALS: Record<Professional, { label: string; quizLabel: string }> = {
  GERAL: { label: 'Reparos gerais', quizLabel: 'Geral / Reparos gerais' },
  HIDRAULICA: { label: 'Hidráulico', quizLabel: 'Hidráulico' },
  ELETRICISTA: { label: 'Eletricista', quizLabel: 'Eletricista' },
  REFRIGERACAO: { label: 'Refrigeração', quizLabel: 'Refrigeração' },
};
export const PROFESSIONAL_KEYS: Professional[] = ['GERAL', 'HIDRAULICA', 'ELETRICISTA', 'REFRIGERACAO'];

/** Mapeamento inicial área → profissional (o admin pode redirecionar depois) */
export const AREA_TO_PROFESSIONAL: Record<ServiceArea, Professional> = {
  ELETRICA: 'ELETRICISTA',
  HIDRAULICA: 'HIDRAULICA',
  REFRIGERACAO: 'REFRIGERACAO',
  REPAROS: 'GERAL',
  INSTALACOES: 'GERAL',
};

/* ---------- Os 3 tipos de agendamento ----------
 * ATENÇÃO: VALORES DE SIMULAÇÃO. Os valores e durações oficiais ainda
 * não foram definidos pela JC Resolve. Basta alterar aqui para atualizar
 * todo o sistema (loja, checkout, agenda e dashboard).
 */
export type ServiceType = 'SIMPLES' | 'INTERMEDIARIO' | 'COMPLEXO';

export const SERVICE_TYPES: Record<ServiceType, { label: string; price: number; durationMin: number; description: string }> = {
  SIMPLES: { label: 'Serviço simples', price: 120, durationMin: 60, description: 'Menor complexidade e menor tempo de execução.' },
  INTERMEDIARIO: { label: 'Serviço intermediário', price: 220, durationMin: 120, description: 'Complexidade e tempo de execução moderados.' },
  COMPLEXO: { label: 'Serviço complexo', price: 380, durationMin: 180, description: 'Maior complexidade e maior tempo de execução.' },
};
export const SERVICE_TYPE_KEYS: ServiceType[] = ['SIMPLES', 'INTERMEDIARIO', 'COMPLEXO'];

/* ---------- Urgência (classificação de protótipo, sem SLA) ---------- */
export type Urgency = 'BAIXA' | 'MEDIA' | 'ALTA';
export const URGENCIES: Record<Urgency, { label: string }> = {
  BAIXA: { label: 'Baixa' },
  MEDIA: { label: 'Média' },
  ALTA: { label: 'Alta' },
};
export const URGENCY_KEYS: Urgency[] = ['BAIXA', 'MEDIA', 'ALTA'];

/* ---------- Status ---------- */
export const APPOINTMENT_STATUS: Record<string, string> = {
  AGENDADO: 'Agendado',
  CONFIRMADO: 'Confirmado',
  EM_ATENDIMENTO: 'Em atendimento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};
export const ORDER_STATUS: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  PAGAMENTO_CONFIRMADO: 'Pagamento confirmado',
  EM_PREPARACAO: 'Em preparação',
  ENVIADO: 'Enviado / saiu para entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

/** Regra de desconto informada pelo cliente: produtos + serviço = 10% */
export const COMBO_DISCOUNT_RATE = 0.1;

/* ---------- Janela de horários DEMONSTRATIVA ----------
 * Não representa a disponibilidade real da empresa.
 */
export const WORK_START_MIN = 8 * 60; // 08:00
export const WORK_END_MIN = 18 * 60; // 18:00
export const SLOT_STEP_MIN = 30; // intervalos de 30 minutos

export const CONFLICT_MESSAGE = 'Este profissional já possui um atendimento nesse período. Escolha outro horário.';
export const EDIT_CONFLICT_MESSAGE = 'Não foi possível alterar o agendamento porque existe conflito de horário para este profissional.';

/** Formata número em Real brasileiro (locale explícito evita erro de hidratação) */
export function formatBRL(value?: number | null): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value ?? 0));
}
