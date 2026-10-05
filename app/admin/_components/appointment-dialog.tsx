'use client';

/* =====================================================================
 * CRIAR / EDITAR AGENDAMENTO (admin)
 * - Mostra aviso de conflito em tempo real com base na agenda carregada.
 * - O servidor revalida o conflito ao salvar (fonte da verdade).
 * - Ações rápidas: Confirmar, Cancelar e alterar status.
 * ===================================================================== */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Loader2, Package, Save, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  APPOINTMENT_STATUS, AREA_TO_PROFESSIONAL, CONFLICT_MESSAGE, EDIT_CONFLICT_MESSAGE, formatBRL, PROFESSIONAL_KEYS, PROFESSIONALS, SERVICE_AREAS,
  SERVICE_TYPE_KEYS, SERVICE_TYPES, ServiceArea, ServiceType, URGENCIES, URGENCY_KEYS,
} from '@/lib/constants';
import { findConflict, minToTime, timeToMin } from '@/lib/scheduling';
import type { AdminAppointment } from './types';

export interface DialogState {
  open: boolean;
  appointment?: AdminAppointment;
  defaults?: { date?: string; professional?: string; startMin?: number };
}

interface FormState {
  customerName: string; customerPhone: string; customerEmail: string; address: string;
  serviceArea: string; professional: string; serviceType: string; price: string;
  problemDescription: string; urgency: string; date: string; start: string; end: string; status: string; notes: string;
}

function initialForm(state: DialogState): FormState {
  const a = state.appointment;
  if (a) {
    return {
      customerName: a.customerName, customerPhone: a.customerPhone, customerEmail: a.customerEmail ?? '', address: a.address ?? '',
      serviceArea: a.serviceArea, professional: a.professional, serviceType: a.serviceType, price: String(a.price),
      problemDescription: a.problemDescription, urgency: a.urgency, date: a.date, start: minToTime(a.startMin), end: minToTime(a.endMin),
      status: a.status, notes: a.notes ?? '',
    };
  }
  const start = state.defaults?.startMin ?? 9 * 60;
  return {
    customerName: '', customerPhone: '', customerEmail: '', address: '',
    serviceArea: 'REPAROS', professional: state.defaults?.professional ?? 'GERAL', serviceType: 'SIMPLES', price: String(SERVICE_TYPES.SIMPLES.price),
    problemDescription: '', urgency: 'MEDIA', date: state.defaults?.date ?? '', start: minToTime(start), end: minToTime(start + SERVICE_TYPES.SIMPLES.durationMin),
    status: 'AGENDADO', notes: '',
  };
}

export function AppointmentDialog({ state, onClose, appointments }: { state: DialogState; onClose: () => void; appointments: AdminAppointment[] }) {
  const router = useRouter();
  const editing = !!state.appointment;
  const [form, setForm] = useState<FormState>(() => initialForm(state));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sempre que o diálogo abre, recarrega o formulário
  useEffect(() => {
    if (state.open) { setForm(initialForm(state)); setError(''); }
  }, [state]);

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const startMin = timeToMin(form.start);
  const endMin = timeToMin(form.end);

  // Conflito em tempo real (mesma regra usada pelo servidor)
  const liveConflict = useMemo(() => {
    if (form.status === 'CANCELADO' || !form.date || !Number.isFinite(startMin) || !Number.isFinite(endMin) || endMin <= startMin) return null;
    return findConflict({ id: state.appointment?.id, professional: form.professional, date: form.date, startMin, endMin }, appointments);
  }, [form.status, form.date, form.professional, startMin, endMin, appointments, state.appointment?.id]);

  const onArea = (area: string) => {
    setForm((f) => ({ ...f, serviceArea: area, professional: editing ? f.professional : AREA_TO_PROFESSIONAL[area as ServiceArea] ?? f.professional }));
  };
  const onType = (t: string) => {
    const info = SERVICE_TYPES[t as ServiceType];
    setForm((f) => ({ ...f, serviceType: t, price: String(info?.price ?? f.price), end: Number.isFinite(timeToMin(f.start)) && info ? minToTime(timeToMin(f.start) + info.durationMin) : f.end }));
  };
  const onStart = (v: string) => {
    // Mantém a duração atual ao mudar o início
    const dur = Number.isFinite(endMin - startMin) && endMin > startMin ? endMin - startMin : SERVICE_TYPES[form.serviceType as ServiceType]?.durationMin ?? 60;
    const s = timeToMin(v);
    setForm((f) => ({ ...f, start: v, end: Number.isFinite(s) ? minToTime(Math.min(24 * 60, s + dur)) : f.end }));
  };

  const save = async (override?: Partial<FormState>) => {
    const f = { ...form, ...(override ?? {}) };
    setSaving(true);
    setError('');
    try {
      const payload = {
        customerName: f.customerName, customerPhone: f.customerPhone, customerEmail: f.customerEmail, address: f.address,
        serviceArea: f.serviceArea, professional: f.professional, serviceType: f.serviceType, price: Number(f.price),
        problemDescription: f.problemDescription, urgency: f.urgency, date: f.date,
        startMin: timeToMin(f.start), endMin: timeToMin(f.end), status: f.status, notes: f.notes,
      };
      const res = await fetch(editing ? `/api/appointments/${state.appointment?.id}` : '/api/admin/appointments', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Não foi possível salvar.');
      toast.success(editing ? 'Agendamento atualizado.' : 'Agendamento criado.');
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const input = 'field';
  return (
    <Dialog open={state.open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{editing ? 'Editar agendamento' : 'Novo agendamento'}</DialogTitle>
          <DialogDescription>
            {editing && state.appointment?.orderCode ? `Pedido ${state.appointment.orderCode} • ` : ''}Toda alteração de data, horário ou profissional é validada contra conflitos.
          </DialogDescription>
        </DialogHeader>

        {editing && (
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={saving} onClick={() => save({ status: 'CONFIRMADO' })} className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"><CheckCircle2 className="h-4 w-4" /> Confirmar</button>
            <button type="button" disabled={saving} onClick={() => save({ status: 'CANCELADO' })} className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground disabled:opacity-60"><XCircle className="h-4 w-4" /> Cancelar agendamento</button>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="grid gap-3 sm:grid-cols-2">
          <L label="Cliente *" id="ad-nome"><input id="ad-nome" className={input} value={form.customerName} onChange={(e) => set('customerName', e.target.value)} required /></L>
          <L label="Telefone *" id="ad-tel"><input id="ad-tel" className={input} value={form.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} required /></L>
          <L label="E-mail" id="ad-email"><input id="ad-email" type="email" className={input} value={form.customerEmail} onChange={(e) => set('customerEmail', e.target.value)} /></L>
          <L label="Endereço" id="ad-end"><input id="ad-end" className={input} value={form.address} onChange={(e) => set('address', e.target.value)} /></L>
          <L label="Serviço *" id="ad-area">
            <select id="ad-area" className={input} value={form.serviceArea} onChange={(e) => onArea(e.target.value)}>
              {Object.keys(SERVICE_AREAS).map((k) => <option key={k} value={k}>{SERVICE_AREAS[k as ServiceArea].label}</option>)}
            </select>
          </L>
          <L label="Profissional *" id="ad-pro">
            <select id="ad-pro" className={input} value={form.professional} onChange={(e) => set('professional', e.target.value)}>
              {PROFESSIONAL_KEYS.map((k) => <option key={k} value={k}>{PROFESSIONALS[k].label}</option>)}
            </select>
          </L>
          <L label="Tipo de agendamento *" id="ad-tipo">
            <select id="ad-tipo" className={input} value={form.serviceType} onChange={(e) => onType(e.target.value)}>
              {SERVICE_TYPE_KEYS.map((k) => <option key={k} value={k}>{SERVICE_TYPES[k].label} ({formatBRL(SERVICE_TYPES[k].price)})</option>)}
            </select>
          </L>
          <L label="Valor (R$) — simulação" id="ad-valor"><input id="ad-valor" type="number" min={0} step="0.01" className={input} value={form.price} onChange={(e) => set('price', e.target.value)} /></L>
          <L label="Data *" id="ad-data"><input id="ad-data" type="date" className={input} value={form.date} onChange={(e) => set('date', e.target.value)} required /></L>
          <div className="grid grid-cols-2 gap-3">
            <L label="Início *" id="ad-ini"><input id="ad-ini" type="time" step={1800} className={input} value={form.start} onChange={(e) => onStart(e.target.value)} required /></L>
            <L label="Término *" id="ad-fim"><input id="ad-fim" type="time" step={1800} className={input} value={form.end} onChange={(e) => set('end', e.target.value)} required /></L>
          </div>
          <L label="Urgência *" id="ad-urg">
            <select id="ad-urg" className={input} value={form.urgency} onChange={(e) => set('urgency', e.target.value)}>
              {URGENCY_KEYS.map((k) => <option key={k} value={k}>{URGENCIES[k].label}</option>)}
            </select>
          </L>
          <L label="Status *" id="ad-status">
            <select id="ad-status" className={input} value={form.status} onChange={(e) => set('status', e.target.value)}>
              {Object.keys(APPOINTMENT_STATUS).map((k) => <option key={k} value={k}>{APPOINTMENT_STATUS[k]}</option>)}
            </select>
          </L>
          <div className="sm:col-span-2">
            <L label="Descrição do problema *" id="ad-desc"><textarea id="ad-desc" rows={3} className="w-full rounded-lg border border-input p-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30" value={form.problemDescription} onChange={(e) => set('problemDescription', e.target.value)} required /></L>
          </div>
          <div className="sm:col-span-2">
            <L label="Observações internas" id="ad-obs"><textarea id="ad-obs" rows={2} className="w-full rounded-lg border border-input p-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></L>
          </div>

          {editing && (state.appointment?.products?.length ?? 0) > 0 && (
            <div className="rounded-lg bg-muted p-3 text-sm sm:col-span-2">
              <p className="flex items-center gap-1.5 font-semibold"><Package className="h-4 w-4" /> Produtos associados ao pedido</p>
              <ul className="mt-1 list-inside list-disc text-muted-foreground">{state.appointment?.products.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          )}

          {liveConflict && (
            <p role="alert" className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900 sm:col-span-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {editing ? EDIT_CONFLICT_MESSAGE : CONFLICT_MESSAGE} (ocupado das {minToTime(liveConflict.startMin)} às {minToTime(liveConflict.endMin)})
            </p>
          )}
          {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive sm:col-span-2">{error}</p>}

          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={onClose} className="rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold hover:bg-accent">Fechar</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-95 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function L({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return <div><label htmlFor={id} className="field-label">{label}</label>{children}</div>;
}
