/* Tipos de serviço editáveis pelo admin.
 * Os valores padrão ficam em lib/constants.ts (SERVICE_TYPES). O que o admin salva no banco
 * (tabela ServiceTypeConfig) é aplicado POR CIMA desses padrões. Se o banco falhar, valem os padrões. */
import { SERVICE_TYPES, SERVICE_TYPE_KEYS, type ServiceType } from './constants';
import { prisma } from './db';

export type ServiceTypeInfo = { label: string; price: number; durationMin: number; description: string };
export type ServiceTypesMap = Record<ServiceType, ServiceTypeInfo>;

/** Aplica os valores do banco sobre SERVICE_TYPES e devolve uma cópia. Chame no início de páginas/rotas do servidor. */
export async function loadServiceTypes(): Promise<ServiceTypesMap> {
  try {
    const rows = await prisma.serviceTypeConfig.findMany();
    for (const r of rows) {
      if (r.key in SERVICE_TYPES) {
        Object.assign(SERVICE_TYPES[r.key as ServiceType], { label: r.label, price: r.price, durationMin: r.durationMin, description: r.description });
      }
    }
  } catch (err) {
    console.error('Tipos de serviço: usando valores padrão.', err);
  }
  return snapshotServiceTypes();
}

export function snapshotServiceTypes(): ServiceTypesMap {
  return Object.fromEntries(SERVICE_TYPE_KEYS.map((k) => [k, { ...SERVICE_TYPES[k] }])) as ServiceTypesMap;
}

type Parsed = { ok: true; data: ServiceTypeInfo } | { ok: false; error: string };

export function parseServiceTypeInput(body: unknown): Parsed {
  const b = (body ?? {}) as Record<string, unknown>;
  const label = String(b.label ?? '').trim();
  if (label.length < 3 || label.length > 60) return { ok: false, error: 'O nome do serviço deve ter de 3 a 60 letras.' };
  const price = Number(String(b.price ?? '').replace(',', '.'));
  if (!Number.isFinite(price) || price <= 0 || price > 100000) return { ok: false, error: 'Informe um preço válido, maior que zero.' };
  const durationMin = Math.floor(Number(b.durationMin));
  if (!Number.isFinite(durationMin) || durationMin < 30 || durationMin > 600 || durationMin % 30 !== 0) {
    return { ok: false, error: 'A duração deve ser de 30 em 30 minutos (de 30 a 600).' };
  }
  const description = String(b.description ?? '').trim();
  if (description.length > 200) return { ok: false, error: 'A descrição está muito longa (máximo 200 caracteres).' };
  return { ok: true, data: { label, price: Math.round(price * 100) / 100, durationMin, description } };
}
