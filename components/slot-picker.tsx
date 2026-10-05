'use client';

/* =====================================================================
 * SELETOR DE DATA E HORÁRIO COM CONTROLE DE CONFLITO
 * - busca os períodos já ocupados do profissional na data escolhida;
 * - marca como "Ocupado" todo horário que se sobrepõe (mesma regra do servidor);
 * - ao clicar num horário ocupado, mostra a mensagem de conflito e não seleciona.
 * Horários exibidos são DEMONSTRATIVOS (não representam a disponibilidade real).
 * ===================================================================== */
import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, Clock, Loader2 } from 'lucide-react';
import { CONFLICT_MESSAGE, PROFESSIONALS, Professional } from '@/lib/constants';
import { addDays, buildStartSlots, findConflict, formatDateBR, minToTime, nowMinutesBR, TimeInterval, todayISO, weekdayName } from '@/lib/scheduling';

/** Busca os intervalos ocupados (usado também para revalidar antes de avançar) */
export async function fetchBusy(professional: string, date: string, excludeId?: string): Promise<TimeInterval[]> {
  const qs = new URLSearchParams({ professional, date, ...(excludeId ? { excludeId } : {}) });
  const res = await fetch(`/api/availability?${qs.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao consultar a agenda.');
  const data = await res.json().catch(() => ({}));
  return Array.isArray(data?.busy) ? data.busy : [];
}

/** Revalida um horário escolhido consultando a agenda mais recente */
export async function checkSlotConflict(professional: string, date: string, startMin: number, durationMin: number, excludeId?: string): Promise<boolean> {
  const busy = await fetchBusy(professional, date, excludeId);
  return !!findConflict({ professional, date, startMin, endMin: startMin + durationMin }, busy);
}

interface Props {
  professional: Professional;
  durationMin: number;
  date: string;
  startMin: number | null;
  onChange: (v: { date: string; startMin: number | null }) => void;
  excludeId?: string;
}

export function SlotPicker({ professional, durationMin, date, startMin, onChange, excludeId }: Props) {
  const [today, setToday] = useState('');
  const [nowMin, setNowMin] = useState(0);
  const [busy, setBusy] = useState<TimeInterval[]>([]);
  const [loading, setLoading] = useState(false);
  const [conflictMsg, setConflictMsg] = useState('');

  // Data/hora só no navegador (evita diferença entre servidor e cliente)
  useEffect(() => {
    setToday(todayISO());
    setNowMin(nowMinutesBR());
  }, []);

  const load = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    try {
      setBusy(await fetchBusy(professional, date, excludeId));
    } catch (err) {
      console.error(err);
      setBusy([]);
    } finally {
      setLoading(false);
    }
  }, [professional, date, excludeId]);

  useEffect(() => { load(); }, [load]);

  // Se o horário já escolhido passou a conflitar (ex.: trocou o tipo de serviço), limpa a seleção
  useEffect(() => {
    if (startMin === null || !date) return;
    const c = findConflict({ professional, date, startMin, endMin: startMin + durationMin }, busy);
    if (c) {
      setConflictMsg(CONFLICT_MESSAGE);
      onChange({ date, startMin: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, durationMin]);

  const slots = buildStartSlots(durationMin);
  const quickDates = today ? [0, 1, 2, 3, 4, 5, 6].map((d) => addDays(today, d)) : [];

  const pick = (t: number, conflict: boolean) => {
    if (conflict) {
      setConflictMsg(CONFLICT_MESSAGE);
      return;
    }
    setConflictMsg('');
    onChange({ date, startMin: t });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="field-label flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Data</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {quickDates.map((d) => (
            <button key={d} type="button" onClick={() => { setConflictMsg(''); onChange({ date: d, startMin: null }); }} aria-pressed={d === date}
              className={`shrink-0 rounded-lg px-3 py-2 text-center text-xs transition ${d === date ? 'bg-secondary text-secondary-foreground shadow' : 'bg-muted hover:bg-accent'}`}>
              <span className="block font-semibold">{d === today ? 'Hoje' : weekdayName(d).slice(0, 3)}</span>
              <span className="block">{formatDateBR(d).slice(0, 5)}</span>
            </button>
          ))}
          <label className="sr-only" htmlFor="outra-data">Outra data</label>
          <input id="outra-data" type="date" min={today || undefined} value={date} onChange={(e) => { setConflictMsg(''); onChange({ date: e.target.value, startMin: null }); }} className="field h-auto w-auto shrink-0 py-2 text-xs" />
        </div>
      </div>

      {date && (
        <div>
          <p className="field-label flex items-center gap-1.5"><Clock className="h-4 w-4" /> Horário de início — {weekdayName(date)}, {formatDateBR(date)}
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {slots.map((t) => {
              const conflict = !!findConflict({ professional, date, startMin: t, endMin: t + durationMin, id: excludeId }, busy);
              const past = date < today || (date === today && t <= nowMin);
              const selected = startMin === t;
              return (
                <button
                  key={t}
                  type="button"
                  disabled={past || loading}
                  onClick={() => pick(t, conflict)}
                  aria-pressed={selected}
                  aria-label={`${minToTime(t)} às ${minToTime(t + durationMin)}${conflict ? ' (ocupado)' : ''}`}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${
                    selected ? 'bg-primary text-primary-foreground shadow ring-2 ring-deep' : conflict ? 'bg-destructive/10 text-destructive line-through' : 'bg-muted hover:bg-accent'
                  }`}
                >
                  {minToTime(t)}–{minToTime(t + durationMin)}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Agenda de: <strong>{PROFESSIONALS[professional]?.label}</strong>. Riscados = período já ocupado por este profissional. Horários demonstrativos.
          </p>
        </div>
      )}

      {conflictMsg && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {conflictMsg}
        </p>
      )}
    </div>
  );
}
