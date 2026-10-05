'use client';

/* =====================================================================
 * PAINEL ADMIN — navegação por abas:
 * Visão geral | Agenda de Serviços | Pedidos | Produtos e serviços
 * ===================================================================== */
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarCheck, CalendarDays, ClipboardList, LayoutDashboard, Package, PackageCheck, Plus, ShoppingBag, Wrench } from 'lucide-react';
import { APPOINTMENT_STATUS, formatBRL, ORDER_STATUS, PROFESSIONAL_KEYS, PROFESSIONALS, SERVICE_AREAS } from '@/lib/constants';
import { formatDateBR, minToTime, todayISO } from '@/lib/scheduling';
import type { AdminAppointment, AdminOrder, AdminProduct } from './types';
import { APPT_STATUS_STYLE, ORDER_STATUS_STYLE, PRO_COLORS } from './ui-helpers';
import { SchedulePanel } from './schedule-panel';
import { AppointmentDialog, DialogState } from './appointment-dialog';
import { OrdersPanel } from './orders-panel';
import { ProductsPanel } from './products-panel';

const ChartLoading = () => <div className="grid h-full place-items-center text-sm text-muted-foreground">Carregando gráfico...</div>;
const ProfessionalBarChart = dynamic(() => import('./overview-charts').then((m) => m.ProfessionalBarChart), { ssr: false, loading: ChartLoading });
const StatusPieChart = dynamic(() => import('./overview-charts').then((m) => m.StatusPieChart), { ssr: false, loading: ChartLoading });

type Tab = 'geral' | 'agenda' | 'pedidos' | 'produtos';
const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'geral', label: 'Visão geral', icon: LayoutDashboard },
  { key: 'agenda', label: 'Agenda de Serviços', icon: CalendarDays },
  { key: 'pedidos', label: 'Pedidos', icon: ClipboardList },
  { key: 'produtos', label: 'Produtos e serviços', icon: Package },
];

const STATUS_COLORS: Record<string, string> = { AGENDADO: '#FF9149', CONFIRMADO: '#60B5FF', EM_ATENDIMENTO: '#A19AD3', CONCLUIDO: '#72BF78', CANCELADO: '#FF9898' };

export function AdminDashboard({ appointments, orders, products }: { appointments: AdminAppointment[]; orders: AdminOrder[]; products: AdminProduct[] }) {
  const [tab, setTab] = useState<Tab>('geral');
  const [today, setToday] = useState('');
  const [dialog, setDialog] = useState<DialogState>({ open: false });

  // "Hoje" calculado só no navegador (evita diferença de renderização)
  useEffect(() => { setToday(todayISO()); }, []);

  const openEdit = (a: AdminAppointment) => setDialog({ open: true, appointment: a });
  const openCreate = (defaults?: { date?: string; professional?: string; startMin?: number }) => setDialog({ open: true, defaults: { date: defaults?.date ?? today, ...defaults } });

  return (
    <div className="bg-muted py-8">
      <div className="container-jc">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold">Painel administrativo</h1>
            <p className="mt-1 text-muted-foreground">Gerencie agendamentos, pedidos e produtos da JC Resolve.</p>
          </div>
          <button type="button" onClick={() => openCreate()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-bold text-primary-foreground shadow-sm hover:brightness-95">
            <Plus className="h-4 w-4" /> Novo agendamento
          </button>
        </div>

        <nav className="mt-6 flex gap-1 overflow-x-auto rounded-xl bg-card p-1.5 shadow-sm scrollbar-none" role="tablist" aria-label="Seções do painel">
          {TABS.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${tab === t.key ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-6">
          {tab === 'geral' && <Overview appointments={appointments} orders={orders} today={today} onOpen={openEdit} goTo={setTab} />}
          {tab === 'agenda' && today && <SchedulePanel appointments={appointments} today={today} onOpen={openEdit} onCreate={openCreate} />}
          {tab === 'pedidos' && <OrdersPanel orders={orders} />}
          {tab === 'produtos' && <ProductsPanel products={products} />}
        </div>
      </div>
      <AppointmentDialog state={dialog} onClose={() => setDialog({ open: false })} appointments={appointments} />
    </div>
  );
}

/* ---------------------- VISÃO GERAL ---------------------- */
function Overview({ appointments, orders, today, onOpen, goTo }: {
  appointments: AdminAppointment[]; orders: AdminOrder[]; today: string; onOpen: (a: AdminAppointment) => void; goTo: (t: Tab) => void;
}) {
  const stats = useMemo(() => {
    const active = appointments.filter((a) => a.status !== 'CANCELADO');
    const validOrders = orders.filter((o) => o.status !== 'CANCELADO');
    return {
      total: appointments.length,
      todayList: active.filter((a) => a.date === today),
      upcoming: active.filter((a) => a.date >= today && a.status !== 'CONCLUIDO').slice(0, 6),
      servicesHired: validOrders.filter((o) => !!o.appointmentId).length + active.filter((a) => !a.orderId).length,
      productsSold: validOrders.reduce((s, o) => s + o.items.reduce((q, i) => q + i.quantity, 0), 0),
      pendingConfirm: active.filter((a) => a.status === 'AGENDADO' && a.date >= today),
      pendingPayment: orders.filter((o) => o.status === 'AGUARDANDO_PAGAMENTO'),
      byPro: PROFESSIONAL_KEYS.map((p) => ({ name: PROFESSIONALS[p].label, value: active.filter((a) => a.professional === p).length, color: PRO_COLORS[p]?.bar ?? '#60B5FF' })),
      byStatus: Object.keys(APPOINTMENT_STATUS).map((s) => ({ name: APPOINTMENT_STATUS[s], value: appointments.filter((a) => a.status === s).length, color: STATUS_COLORS[s] ?? '#80D8C3' })),
    };
  }, [appointments, orders, today]);

  const cards = [
    { label: 'Total de agendamentos', value: stats.total, icon: CalendarDays },
    { label: 'Agendamentos de hoje', value: stats.todayList.length, icon: CalendarCheck },
    { label: 'Serviços contratados', value: stats.servicesHired, icon: Wrench },
    { label: 'Produtos vendidos', value: stats.productsSold, icon: PackageCheck },
  ];

  return (
    <div className="space-y-6">
      <p className="badge-sim">Inclui dados demonstrativos de teste</p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card-jc p-4 hover:shadow-lg">
            <c.icon className="h-5 w-5 text-deep" />
            <p className="mt-2 font-display text-3xl font-extrabold">{c.value}</p>
            <p className="text-xs text-muted-foreground sm:text-sm">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-jc p-5">
          <h2 className="font-display text-lg font-bold">Agendamentos ativos por profissional</h2>
          <div className="mt-3 h-64"><ProfessionalBarChart data={stats.byPro} /></div>
        </section>
        <section className="card-jc p-5">
          <h2 className="font-display text-lg font-bold">Agendamentos por status</h2>
          <div className="mt-3 h-64"><StatusPieChart data={stats.byStatus} /></div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card-jc p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Próximos agendamentos</h2>
            <button type="button" onClick={() => goTo('agenda')} className="text-sm font-semibold text-deep hover:underline">Abrir agenda</button>
          </div>
          {stats.upcoming.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nenhum agendamento futuro.</p> : (
            <ul className="mt-3 space-y-2">
              {stats.upcoming.map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => onOpen(a)} className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-lg p-3 text-left text-sm ${PRO_COLORS[a.professional]?.chip ?? 'bg-muted'}`}>
                    <span><strong>{formatDateBR(a.date)} {minToTime(a.startMin)}–{minToTime(a.endMin)}</strong> • {a.customerName} • {SERVICE_AREAS[a.serviceArea as keyof typeof SERVICE_AREAS]?.label ?? a.serviceArea}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${APPT_STATUS_STYLE[a.status] ?? ''}`}>{APPOINTMENT_STATUS[a.status] ?? a.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-jc p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold"><AlertCircle className="h-5 w-5 text-warning" /> Pendências</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between rounded-lg bg-muted p-3"><span>Agendamentos aguardando confirmação</span><strong>{stats.pendingConfirm.length}</strong></li>
            <li className="flex justify-between rounded-lg bg-muted p-3"><span>Pedidos aguardando pagamento</span><strong>{stats.pendingPayment.length}</strong></li>
          </ul>
          {stats.pendingConfirm.slice(0, 3).map((a) => (
            <button key={a.id} type="button" onClick={() => onOpen(a)} className="mt-2 block w-full rounded-lg bg-amber-50 p-2.5 text-left text-xs hover:bg-amber-100">
              Confirmar: <strong>{a.customerName}</strong> — {formatDateBR(a.date)} {minToTime(a.startMin)}
            </button>
          ))}
        </section>
      </div>

      <section className="card-jc p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold"><ShoppingBag className="h-5 w-5 text-deep" /> Pedidos recentes</h2>
          <button type="button" onClick={() => goTo('pedidos')} className="text-sm font-semibold text-deep hover:underline">Ver todos</button>
        </div>
        {orders.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nenhum pedido ainda.</p> : (
          <ul className="mt-3 divide-y text-sm">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span><strong>{o.code}</strong> • {o.customerName}</span>
                <span className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ORDER_STATUS_STYLE[o.status] ?? ''}`}>{ORDER_STATUS[o.status] ?? o.status}</span>
                  <strong>{formatBRL(o.total)}</strong>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
