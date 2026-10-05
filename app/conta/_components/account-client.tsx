'use client';

/* Agendamentos do cliente com ações de CANCELAR e REAGENDAR.
 * O reagendamento usa o mesmo seletor com controle de conflito; o servidor
 * revalida tudo e devolve a mensagem de conflito se for o caso. */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { CalendarClock, CalendarX2, Loader2, LogOut, RefreshCw, X } from 'lucide-react';
import { SlotPicker, checkSlotConflict } from '@/components/slot-picker';
import { APPOINTMENT_STATUS, EDIT_CONFLICT_MESSAGE, formatBRL, Professional, PROFESSIONALS, SERVICE_AREAS, SERVICE_TYPES, URGENCIES } from '@/lib/constants';
import { formatDateBR, minToTime } from '@/lib/scheduling';

export interface AccountAppointment {
  id: string; serviceArea: string; professional: string; serviceType: string; problemDescription: string;
  urgency: string; date: string; startMin: number; endMin: number; status: string; price: number;
}

const STATUS_STYLE: Record<string, string> = {
  AGENDADO: 'bg-amber-100 text-amber-800',
  CONFIRMADO: 'bg-sky-100 text-sky-800',
  EM_ATENDIMENTO: 'bg-violet-100 text-violet-800',
  CONCLUIDO: 'bg-emerald-100 text-emerald-800',
  CANCELADO: 'bg-slate-200 text-slate-600',
};

export function LogoutButton() {
  return (
    <button type="button" onClick={() => signOut({ redirectTo: '/' })} className="inline-flex items-center gap-2 rounded-lg bg-card px-4 py-2.5 text-sm font-semibold shadow hover:shadow-md">
      <LogOut className="h-4 w-4" /> Sair
    </button>
  );
}

export function AccountAppointments({ appointments }: { appointments: AccountAppointment[] }) {
  return (
    <section className="card-jc p-5" aria-labelledby="agendamentos">
      <h2 id="agendamentos" className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><CalendarClock className="h-5 w-5 text-deep" /> Meus agendamentos</h2>
      {(appointments?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum agendamento por enquanto.</p>
      ) : (
        <ul className="space-y-3">
          {appointments.map((a) => <AppointmentItem key={a.id} a={a} />)}
        </ul>
      )}
    </section>
  );
}

function AppointmentItem({ a }: { a: AccountAppointment }) {
  const router = useRouter();
  const [mode, setMode] = useState<'view' | 'cancel' | 'reschedule'>('view');
  const [slot, setSlot] = useState<{ date: string; startMin: number | null }>({ date: a.date, startMin: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const editable = a.status === 'AGENDADO' || a.status === 'CONFIRMADO';
  const duration = a.endMin - a.startMin;

  const send = async (body: Record<string, unknown>, okMsg: string) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/appointments/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Não foi possível alterar o agendamento.');
      toast.success(okMsg);
      setMode('view');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar.');
    } finally {
      setBusy(false);
    }
  };

  const reschedule = async () => {
    if (!slot.date || slot.startMin === null) { setError('Escolha a nova data e o horário.'); return; }
    // Conferência antecipada (o servidor confere de novo ao gravar)
    try {
      if (await checkSlotConflict(a.professional, slot.date, slot.startMin, duration, a.id)) { setError(EDIT_CONFLICT_MESSAGE); return; }
    } catch (err) { console.error(err); }
    // status/endMin são enviados para que a mesma chamada funcione também para contas admin
    await send({ action: 'reschedule', date: slot.date, startMin: slot.startMin, endMin: slot.startMin + duration, status: 'AGENDADO' }, 'Agendamento reagendado.');
  };

  return (
    <li className="rounded-lg bg-muted p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold">{SERVICE_AREAS[a.serviceArea as keyof typeof SERVICE_AREAS]?.label ?? a.serviceArea} — {SERVICE_TYPES[a.serviceType as keyof typeof SERVICE_TYPES]?.label ?? a.serviceType}</p>
          <p className="text-muted-foreground">{formatDateBR(a.date)}, {minToTime(a.startMin)} às {minToTime(a.endMin)} • Profissional: {PROFESSIONALS[a.professional as Professional]?.label ?? a.professional}</p>
          <p className="text-muted-foreground">Urgência {URGENCIES[a.urgency as keyof typeof URGENCIES]?.label ?? a.urgency} • {formatBRL(a.price)} (simulação)</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[a.status] ?? 'bg-card'}`}>{APPOINTMENT_STATUS[a.status] ?? a.status}</span>
      </div>
      <p className="mt-2 line-clamp-2 italic text-muted-foreground">“{a.problemDescription}”</p>

      {editable && mode === 'view' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => { setMode('reschedule'); setError(''); }} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground"><RefreshCw className="h-3.5 w-3.5" /> Reagendar</button>
          <button type="button" onClick={() => { setMode('cancel'); setError(''); }} className="inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-2 text-xs font-semibold text-destructive shadow-sm"><CalendarX2 className="h-3.5 w-3.5" /> Cancelar</button>
        </div>
      )}

      {mode === 'cancel' && (
        <div className="mt-3 rounded-lg bg-card p-3">
          <p className="font-semibold">Deseja mesmo cancelar este agendamento?</p>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={busy} onClick={() => send({ action: 'cancel', status: 'CANCELADO' }, 'Agendamento cancelado.')} className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground disabled:opacity-60">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Sim, cancelar
            </button>
            <button type="button" onClick={() => setMode('view')} className="rounded-lg bg-muted px-3 py-2 text-xs font-semibold">Voltar</button>
          </div>
        </div>
      )}

      {mode === 'reschedule' && (
        <div className="mt-3 space-y-3 rounded-lg bg-card p-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Escolha a nova data e horário</p>
            <button type="button" onClick={() => setMode('view')} aria-label="Fechar reagendamento" className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>
          <SlotPicker professional={a.professional as Professional} durationMin={duration} date={slot.date} startMin={slot.startMin} excludeId={a.id} onChange={(v) => { setSlot(v); setError(''); }} />
          <button type="button" disabled={busy} onClick={reschedule} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar novo horário
          </button>
        </div>
      )}

      {error && <p role="alert" className="mt-2 rounded-md bg-destructive/10 p-2.5 text-sm text-destructive">{error}</p>}
    </li>
  );
}
