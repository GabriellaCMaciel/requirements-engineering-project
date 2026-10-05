'use client';

/* =====================================================================
 * AGENDA DE SERVIÇOS — visões Dia, Semana e Lista
 * Cada profissional tem sua própria coluna/agenda independente.
 * ===================================================================== */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CalendarDays, ChevronLeft, ChevronRight, List, MapPin, Package, Phone, Plus, Rows3 } from 'lucide-react';
import { APPOINTMENT_STATUS, formatBRL, PROFESSIONAL_KEYS, PROFESSIONALS, Professional, SERVICE_AREAS, SERVICE_TYPES, URGENCIES } from '@/lib/constants';
import { addDays, formatDateBR, minToTime, startOfWeek, weekdayName } from '@/lib/scheduling';
import type { AdminAppointment } from './types';
import { APPT_STATUS_STYLE, customerWhatsApp, PRO_COLORS } from './ui-helpers';

type View = 'dia' | 'semana' | 'lista';
const HOUR_PX = 56;
const areaLabel = (k: string) => SERVICE_AREAS[k as keyof typeof SERVICE_AREAS]?.label ?? k;

export function SchedulePanel({ appointments, today, onOpen, onCreate }: {
  appointments: AdminAppointment[]; today: string; onOpen: (a: AdminAppointment) => void;
  onCreate: (d?: { date?: string; professional?: string; startMin?: number }) => void;
}) {
  const [view, setView] = useState<View>('dia');
  const [date, setDate] = useState(today);
  const [pro, setPro] = useState<'TODOS' | Professional>('TODOS');
  const [showCancelled, setShowCancelled] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [statusFilter, setStatusFilter] = useState('TODOS');

  const pros: Professional[] = pro === 'TODOS' ? PROFESSIONAL_KEYS : [pro];
  const visible = useMemo(
    () => appointments.filter((a) => (pro === 'TODOS' || a.professional === pro) && (showCancelled || a.status !== 'CANCELADO')),
    [appointments, pro, showCancelled],
  );
  const step = view === 'semana' ? 7 : 1;

  return (
    <section className="card-jc p-4 sm:p-5" aria-label="Agenda de Serviços">
      {/* Barra de controles */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex rounded-lg bg-muted p-1" role="tablist" aria-label="Visualização">
          {([['dia', 'Dia', Rows3], ['semana', 'Semana', CalendarDays], ['lista', 'Lista', List]] as const).map(([k, label, Icon]) => (
            <button key={k} type="button" role="tab" aria-selected={view === k} onClick={() => setView(k)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold ${view === k ? 'bg-card shadow' : 'text-muted-foreground'}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        {view !== 'lista' && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setDate(addDays(date, -step))} aria-label="Período anterior" className="rounded-lg bg-muted p-2 hover:bg-accent"><ChevronLeft className="h-4 w-4" /></button>
            <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Data" className="field h-9 w-40" />
            <button type="button" onClick={() => setDate(addDays(date, step))} aria-label="Próximo período" className="rounded-lg bg-muted p-2 hover:bg-accent"><ChevronRight className="h-4 w-4" /></button>
            <button type="button" onClick={() => setDate(today)} className="rounded-lg bg-muted px-3 py-2 text-sm font-semibold hover:bg-accent">Hoje</button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <select value={pro} onChange={(e) => setPro(e.target.value as 'TODOS' | Professional)} aria-label="Profissional" className="field h-9 w-auto">
            <option value="TODOS">Todos os profissionais</option>
            {PROFESSIONAL_KEYS.map((k) => <option key={k} value={k}>{PROFESSIONALS[k].label}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} /> Cancelados</label>
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {PROFESSIONAL_KEYS.map((k) => <span key={k} className="flex items-center gap-1"><span className={`h-2.5 w-2.5 rounded-full ${PRO_COLORS[k]?.dot}`} /> {PROFESSIONALS[k].label}</span>)}
      </div>

      <div className="mt-4">
        {view === 'dia' && <DayView date={date} pros={pros} items={visible.filter((a) => a.date === date)} onOpen={onOpen} onCreate={onCreate} />}
        {view === 'semana' && <WeekView date={date} items={visible} onOpen={onOpen} onCreate={onCreate} onPickDay={(d) => { setDate(d); setView('dia'); }} today={today} />}
        {view === 'lista' && (
          <ListView
            items={visible.filter((a) => (showPast || a.date >= today) && (statusFilter === 'TODOS' || a.status === statusFilter))}
            onOpen={onOpen} statusFilter={statusFilter} setStatusFilter={setStatusFilter} showPast={showPast} setShowPast={setShowPast}
          />
        )}
      </div>
    </section>
  );
}

/* ---------- DIA: uma coluna por profissional, linha do tempo ---------- */
function DayView({ date, pros, items, onOpen, onCreate }: {
  date: string; pros: Professional[]; items: AdminAppointment[]; onOpen: (a: AdminAppointment) => void;
  onCreate: (d?: { date?: string; professional?: string; startMin?: number }) => void;
}) {
  const startH = Math.min(8, ...items.map((a) => Math.floor(a.startMin / 60)));
  const endH = Math.max(18, ...items.map((a) => Math.ceil(a.endMin / 60)));
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i);
  const height = (endH - startH) * HOUR_PX;

  return (
    <div>
      <p className="mb-2 font-display font-bold">{weekdayName(date)}, {formatDateBR(date)}</p>
      <div className="overflow-x-auto">
        <div className="grid" style={{ gridTemplateColumns: `52px repeat(${pros.length}, minmax(160px, 1fr))`, minWidth: 52 + pros.length * 160 }}>
          <div />
          {pros.map((p) => (
            <div key={p} className="flex items-center justify-between gap-1 px-2 pb-2 text-sm font-bold">
              <span className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${PRO_COLORS[p]?.dot}`} /> {PROFESSIONALS[p].label}</span>
              <button type="button" onClick={() => onCreate({ date, professional: p })} aria-label={`Novo agendamento para ${PROFESSIONALS[p].label}`} className="rounded p-1 text-muted-foreground hover:bg-muted"><Plus className="h-4 w-4" /></button>
            </div>
          ))}
          <div className="relative" style={{ height }}>
            {hours.map((h) => <span key={h} className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground" style={{ top: (h - startH) * HOUR_PX }}>{String(h).padStart(2, '0')}:00</span>)}
          </div>
          {pros.map((p) => (
            <div
              key={p}
              className="relative cursor-copy border-l bg-muted/40"
              style={{ height }}
              onClick={(e) => {
                // Clique num espaço vazio cria um agendamento naquele horário
                const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
                const min = startH * 60 + Math.floor((y / HOUR_PX) * 2) * 30;
                onCreate({ date, professional: p, startMin: min });
              }}
              title="Clique para criar um agendamento neste horário"
            >
              {hours.map((h) => <div key={h} className="absolute inset-x-0 border-t border-border/70" style={{ top: (h - startH) * HOUR_PX }} />)}
              {items.filter((a) => a.professional === p).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpen(a); }}
                  className={`absolute inset-x-1 overflow-hidden rounded-md p-1.5 text-left text-[11px] leading-tight shadow-sm hover:shadow-md ${PRO_COLORS[a.professional]?.chip ?? 'bg-card'} ${a.status === 'CANCELADO' ? 'line-through opacity-50' : ''}`}
                  style={{ top: ((a.startMin - startH * 60) / 60) * HOUR_PX + 1, height: Math.max(22, ((a.endMin - a.startMin) / 60) * HOUR_PX - 2) }}
                >
                  <strong>{minToTime(a.startMin)}–{minToTime(a.endMin)}</strong> {a.customerName}
                  <span className="block truncate">{areaLabel(a.serviceArea)} • {APPOINTMENT_STATUS[a.status] ?? a.status}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      {items.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Nenhum agendamento neste dia. Clique em um horário para criar.</p>}
    </div>
  );
}

/* ---------- SEMANA: 7 colunas (segunda a domingo) ---------- */
function WeekView({ date, items, onOpen, onCreate, onPickDay, today }: {
  date: string; items: AdminAppointment[]; onOpen: (a: AdminAppointment) => void; today: string;
  onCreate: (d?: { date?: string }) => void; onPickDay: (d: string) => void;
}) {
  const monday = startOfWeek(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[840px] grid-cols-7 gap-2">
        {days.map((d) => {
          const list = items.filter((a) => a.date === d).sort((x, y) => x.startMin - y.startMin);
          return (
            <div key={d} className={`min-h-[220px] rounded-lg p-2 ${d === today ? 'bg-lime/20' : 'bg-muted'}`}>
              <div className="mb-2 flex items-center justify-between">
                <button type="button" onClick={() => onPickDay(d)} className="text-left text-xs font-bold hover:underline">
                  {weekdayName(d).slice(0, 3)}<span className="block text-sm">{formatDateBR(d).slice(0, 5)}</span>
                </button>
                <button type="button" onClick={() => onCreate({ date: d })} aria-label={`Novo agendamento em ${formatDateBR(d)}`} className="rounded p-1 text-muted-foreground hover:bg-card"><Plus className="h-4 w-4" /></button>
              </div>
              <div className="space-y-1.5">
                {list.map((a) => (
                  <button key={a.id} type="button" onClick={() => onOpen(a)} className={`block w-full rounded-md p-1.5 text-left text-[11px] leading-tight shadow-sm hover:shadow-md ${PRO_COLORS[a.professional]?.chip ?? 'bg-card'} ${a.status === 'CANCELADO' ? 'line-through opacity-50' : ''}`}>
                    <strong>{minToTime(a.startMin)}–{minToTime(a.endMin)}</strong>
                    <span className="block truncate">{a.customerName}</span>
                    <span className="block truncate opacity-80">{PROFESSIONALS[a.professional as Professional]?.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- LISTA: todos os detalhes + troca rápida de status ---------- */
function ListView({ items, onOpen, statusFilter, setStatusFilter, showPast, setShowPast }: {
  items: AdminAppointment[]; onOpen: (a: AdminAppointment) => void; statusFilter: string; setStatusFilter: (s: string) => void;
  showPast: boolean; setShowPast: (b: boolean) => void;
}) {
  const router = useRouter();
  const [savingId, setSavingId] = useState('');
  const sorted = [...items].sort((x, y) => (x.date === y.date ? x.startMin - y.startMin : x.date < y.date ? -1 : 1));

  const changeStatus = async (a: AdminAppointment, status: string) => {
    setSavingId(a.id);
    try {
      const res = await fetch(`/api/appointments/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Não foi possível alterar o status.');
      toast.success('Status atualizado.');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar status.');
    } finally {
      setSavingId('');
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrar por status" className="field h-9 w-auto">
          <option value="TODOS">Todos os status</option>
          {Object.keys(APPOINTMENT_STATUS).map((k) => <option key={k} value={k}>{APPOINTMENT_STATUS[k]}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} /> Mostrar datas anteriores</label>
        <span className="text-sm text-muted-foreground">{sorted.length} agendamento(s)</span>
      </div>
      {sorted.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum agendamento encontrado.</p> : (
        <ul className="space-y-3">
          {sorted.map((a) => {
            const wa = customerWhatsApp(a.customerPhone);
            return (
              <li key={a.id} className={`rounded-lg p-4 text-sm ${PRO_COLORS[a.professional]?.chip ?? 'bg-muted'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{weekdayName(a.date)}, {formatDateBR(a.date)} • {minToTime(a.startMin)} às {minToTime(a.endMin)}</p>
                    <p>{a.customerName} • <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="underline">{a.customerPhone}</a> : a.customerPhone}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={a.status} disabled={savingId === a.id} onChange={(e) => changeStatus(a, e.target.value)} aria-label="Alterar status" className={`h-8 rounded-md border-0 px-2 text-xs font-semibold ${APPT_STATUS_STYLE[a.status] ?? ''}`}>
                      {Object.keys(APPOINTMENT_STATUS).map((k) => <option key={k} value={k}>{APPOINTMENT_STATUS[k]}</option>)}
                    </select>
                    <button type="button" onClick={() => onOpen(a)} className="rounded-md bg-card px-3 py-1.5 text-xs font-semibold shadow-sm hover:shadow">Editar / reagendar</button>
                  </div>
                </div>
                <p className="mt-2 italic opacity-90">“{a.problemDescription}”</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-90">
                  <span>Serviço: <strong>{areaLabel(a.serviceArea)}</strong></span>
                  <span>Tipo: <strong>{SERVICE_TYPES[a.serviceType as keyof typeof SERVICE_TYPES]?.label ?? a.serviceType}</strong></span>
                  <span>Profissional: <strong>{PROFESSIONALS[a.professional as Professional]?.label ?? a.professional}</strong></span>
                  <span>Urgência: <strong>{URGENCIES[a.urgency as keyof typeof URGENCIES]?.label ?? a.urgency}</strong></span>
                  <span>Valor: <strong>{formatBRL(a.price)}</strong></span>
                  {a.orderCode && <span>Pedido: <strong>{a.orderCode}</strong></span>}
                  {a.isDemo && <span className="badge-sim">demo</span>}
                </div>
                {a.address && <p className="mt-1 flex items-center gap-1 text-xs"><MapPin className="h-3 w-3" /> {a.address}</p>}
                {a.products.length > 0 && <p className="mt-1 flex items-center gap-1 text-xs"><Package className="h-3 w-3" /> {a.products.join(', ')}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
