'use client';

/* Entrega aos componentes do navegador os tipos de serviço atuais (preço, nome, duração) vindos do banco.
 * Roda antes das páginas serem desenhadas e atualiza o objeto SERVICE_TYPES usado em todo o site. */
import { SERVICE_TYPES, type ServiceType } from '@/lib/constants';

type Config = Record<string, { label: string; price: number; durationMin: number; description: string }>;

export function ServiceTypesHydrator({ config }: { config: Config }) {
  for (const key of Object.keys(config)) {
    if (key in SERVICE_TYPES) Object.assign(SERVICE_TYPES[key as ServiceType], config[key]);
  }
  return null;
}
