'use client';

import { Check, Clock } from 'lucide-react';
import { formatBRL, SERVICE_TYPE_KEYS, SERVICE_TYPES, ServiceType } from '@/lib/constants';

/** Seleção dos 3 tipos de agendamento (valores de simulação) */
export function ServiceTypePicker({ value, onChange }: { value: ServiceType; onChange: (t: ServiceType) => void }) {
  return (
    <div role="radiogroup" aria-label="Tipo de agendamento" className="grid gap-2 sm:grid-cols-3">
      {SERVICE_TYPE_KEYS.map((t) => {
        const selected = value === t;
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(t)}
            className={`relative rounded-lg p-3 text-left transition ${selected ? 'bg-secondary text-secondary-foreground shadow-md' : 'bg-muted hover:bg-accent'}`}
          >
            {selected && <Check className="absolute right-2 top-2 h-4 w-4 text-primary" />}
            <p className="text-sm font-bold">{SERVICE_TYPES[t].label}</p>
            <p className="font-display text-lg font-extrabold">{formatBRL(SERVICE_TYPES[t].price)}</p>
            <p className={`flex items-center gap-1 text-[11px] ${selected ? 'text-white/70' : 'text-muted-foreground'}`}><Clock className="h-3 w-3" /> {SERVICE_TYPES[t].durationMin / 60}h de agenda</p>
          </button>
        );
      })}
    </div>
  );
}
