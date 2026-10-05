/* Validação dos dados de agendamento enviados pelo PAINEL ADMIN
 * (criar e editar usam exatamente as mesmas regras). */
import { APPOINTMENT_STATUS, PROFESSIONALS, SERVICE_AREAS, SERVICE_TYPES, URGENCIES } from './constants';
import { validateInterval } from './scheduling';

export interface AdminAppointmentInput {
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string | null;
  serviceArea: string;
  professional: string;
  serviceType: string;
  price: number;
  problemDescription: string;
  urgency: string;
  date: string;
  startMin: number;
  endMin: number;
  status: string;
  notes: string | null;
}

const str = (v: unknown, max = 300): string => String(v ?? '').trim().slice(0, max);

export function parseAdminAppointment(body: Record<string, unknown>): { data?: AdminAppointmentInput; error?: string } {
  const data: AdminAppointmentInput = {
    customerName: str(body?.customerName, 120),
    customerPhone: str(body?.customerPhone, 30),
    customerEmail: str(body?.customerEmail, 120) || null,
    address: str(body?.address, 400) || null,
    serviceArea: str(body?.serviceArea, 30),
    professional: str(body?.professional, 30),
    serviceType: str(body?.serviceType, 30),
    price: Number(body?.price ?? 0),
    problemDescription: str(body?.problemDescription, 1000),
    urgency: str(body?.urgency, 10),
    date: str(body?.date, 10),
    startMin: Math.floor(Number(body?.startMin)),
    endMin: Math.floor(Number(body?.endMin)),
    status: str(body?.status, 30) || 'AGENDADO',
    notes: str(body?.notes, 1000) || null,
  };
  if (data.customerName.length < 2) return { error: 'Informe o nome do cliente.' };
  if (data.customerPhone.replace(/\D/g, '').length < 8) return { error: 'Informe o telefone do cliente.' };
  if (!SERVICE_AREAS[data.serviceArea as keyof typeof SERVICE_AREAS]) return { error: 'Serviço inválido.' };
  if (!PROFESSIONALS[data.professional as keyof typeof PROFESSIONALS]) return { error: 'Profissional inválido.' };
  if (!SERVICE_TYPES[data.serviceType as keyof typeof SERVICE_TYPES]) return { error: 'Tipo de agendamento inválido.' };
  if (!URGENCIES[data.urgency as keyof typeof URGENCIES]) return { error: 'Urgência inválida.' };
  if (!APPOINTMENT_STATUS[data.status]) return { error: 'Status inválido.' };
  if (!Number.isFinite(data.price) || data.price < 0) return { error: 'Valor inválido.' };
  if (data.problemDescription.length < 3) return { error: 'Descreva o problema.' };
  const intervalError = validateInterval(data.date, data.startMin, data.endMin);
  if (intervalError) return { error: intervalError };
  return { data };
}
