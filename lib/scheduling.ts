/* =====================================================================
 * LÓGICA DE AGENDAMENTO E CONFLITO DE HORÁRIO
 * Funções "puras" (sem banco de dados) usadas TANTO no navegador
 * (para avisar o cliente antes) QUANTO no servidor (validação final).
 * ===================================================================== */
import { SLOT_STEP_MIN, WORK_END_MIN, WORK_START_MIN } from './constants';

export interface TimeInterval {
  id?: string;
  professional: string;
  date: string; // "AAAA-MM-DD"
  startMin: number;
  endMin: number;
  status?: string;
}

/**
 * REGRA CENTRAL: dois intervalos se sobrepõem quando
 *   inícioA < fimB  E  inícioB < fimA
 * Exemplos:
 *   14:00–16:00 x 15:00–17:00 → conflito (sobreposição parcial)
 *   14:00–16:00 x 14:30–15:00 → conflito (um dentro do outro)
 *   14:00–16:00 x 16:00–17:00 → SEM conflito (um termina quando o outro começa)
 */
export function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Procura um agendamento existente que conflite com o candidato.
 * Só há conflito se for o MESMO profissional, na MESMA data, com horário
 * sobreposto. Agendamentos cancelados liberam o horário.
 * `candidate.id` (quando existe) é ignorado, para permitir editar o próprio registro.
 */
export function findConflict(candidate: TimeInterval, existing: TimeInterval[]): TimeInterval | null {
  const list = existing ?? [];
  for (const item of list) {
    if (!item) continue;
    if (candidate?.id && item?.id === candidate.id) continue; // o próprio agendamento
    if (item?.status === 'CANCELADO') continue; // cancelado não ocupa a agenda
    if (item?.professional !== candidate?.professional) continue; // outro profissional pode
    if (item?.date !== candidate?.date) continue;
    if (intervalsOverlap(candidate.startMin, candidate.endMin, item.startMin, item.endMin)) {
      return item;
    }
  }
  return null;
}

/** Converte minutos (840) em texto "14:00" */
export function minToTime(min?: number | null): string {
  const safe = Math.max(0, Number(min ?? 0));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Converte "14:30" em minutos (870). Retorna NaN se inválido. */
export function timeToMin(time?: string | null): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time ?? '');
  if (!match) return NaN;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Lista os horários de início possíveis para um serviço de `durationMin` minutos */
export function buildStartSlots(durationMin: number): number[] {
  const slots: number[] = [];
  for (let t = WORK_START_MIN; t + durationMin <= WORK_END_MIN; t += SLOT_STEP_MIN) slots.push(t);
  return slots;
}

/** Data de hoje ("AAAA-MM-DD") no fuso de Brasília, igual no servidor e no navegador */
export function todayISO(): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return parts; // en-CA já formata como AAAA-MM-DD
}

/** Minutos atuais do dia no fuso de Brasília (usado para não agendar no passado) */
export function nowMinutesBR(): number {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  return timeToMin(parts);
}

/** Soma dias a uma data "AAAA-MM-DD" (cálculo em UTC para não sofrer com fuso) */
export function addDays(date: string, days: number): string {
  const [y, m, d] = (date ?? '').split('-').map((n: string) => Number(n));
  const dt = new Date(Date.UTC(y || 2000, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** "2026-10-05" → "05/10/2026" */
export function formatDateBR(date?: string | null): string {
  const [y, m, d] = (date ?? '').split('-');
  return y && m && d ? `${d}/${m}/${y}` : '—';
}

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
/** Nome do dia da semana para "AAAA-MM-DD" */
export function weekdayName(date?: string | null): string {
  const [y, m, d] = (date ?? '').split('-').map((n: string) => Number(n));
  if (!y || !m || !d) return '';
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] ?? '';
}

/** Segunda-feira da semana que contém a data */
export function startOfWeek(date: string): string {
  const [y, m, d] = (date ?? '').split('-').map((n: string) => Number(n));
  const dow = new Date(Date.UTC(y || 2000, (m || 1) - 1, d || 1)).getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDays(date, diff);
}

/** Validações básicas de um intervalo (formato, ordem e janela demonstrativa) */
export function validateInterval(date: string, startMin: number, endMin: number): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) return 'Data inválida.';
  if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) return 'Horário inválido.';
  if (endMin <= startMin) return 'O horário de término deve ser depois do início.';
  if (startMin < 0 || endMin > 24 * 60) return 'Horário fora do dia.';
  return null;
}
