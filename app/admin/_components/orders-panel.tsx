'use client';

/* Pedidos: filtro por status, detalhes e alteração de status */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDown, ExternalLink, MessageCircle } from 'lucide-react';
import { formatBRL, ORDER_STATUS } from '@/lib/constants';
import type { AdminOrder } from './types';
import { customerWhatsApp, ORDER_STATUS_STYLE } from './ui-helpers';

const fmtDate = (iso: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(iso));

export function OrdersPanel({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState('TODOS');
  const [open, setOpen] = useState('');
  const [savingId, setSavingId] = useState('');
  const list = orders.filter((o) => filter === 'TODOS' || o.status === filter);

  const changeStatus = async (o: AdminOrder, status: string) => {
    setSavingId(o.id);
    try {
      const res = await fetch(`/api/admin/orders/${o.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Não foi possível alterar o status.');
      toast.success(`Pedido ${o.code}: ${ORDER_STATUS[status] ?? status}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar status.');
    } finally {
      setSavingId('');
    }
  };

  return (
    <section className="card-jc p-4 sm:p-5" aria-label="Pedidos">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrar por status" className="field h-9 w-auto">
          <option value="TODOS">Todos os status</option>
          {Object.keys(ORDER_STATUS).map((k) => <option key={k} value={k}>{ORDER_STATUS[k]}</option>)}
        </select>
        <span className="text-sm text-muted-foreground">{list.length} pedido(s)</span>
      </div>
      {list.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p> : (
        <ul className="space-y-2">
          {list.map((o) => {
            const wa = customerWhatsApp(o.customerPhone, `Olá, ${o.customerName}! Aqui é da JC Resolve, sobre o pedido ${o.code}.`);
            const expanded = open === o.id;
            return (
              <li key={o.id} className="rounded-lg bg-muted text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <button type="button" onClick={() => setOpen(expanded ? '' : o.id)} aria-expanded={expanded} className="flex items-center gap-2 text-left">
                    <ChevronDown className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`} />
                    <span><strong>{o.code}</strong> • {o.customerName}<span className="block text-xs text-muted-foreground">{fmtDate(o.createdAt)} • {o.items.length > 0 ? 'Produtos' : ''}{o.items.length > 0 && o.appointmentId ? ' + ' : ''}{o.appointmentId ? 'Serviço' : ''}</span></span>
                  </button>
                  <div className="flex items-center gap-2">
                    <strong>{formatBRL(o.total)}</strong>
                    <select value={o.status} disabled={savingId === o.id} onChange={(e) => changeStatus(o, e.target.value)} aria-label={`Status do pedido ${o.code}`} className={`h-8 rounded-md border-0 px-2 text-xs font-semibold ${ORDER_STATUS_STYLE[o.status] ?? ''}`}>
                      {Object.keys(ORDER_STATUS).map((k) => <option key={k} value={k}>{ORDER_STATUS[k]}</option>)}
                    </select>
                  </div>
                </div>
                {expanded && (
                  <div className="space-y-2 border-t px-3 pb-3 pt-2">
                    <p className="text-muted-foreground">{o.customerEmail} • {o.customerPhone || 'sem telefone'}</p>
                    <p><strong>Endereço:</strong> {o.address}</p>
                    {o.items.length > 0 && (
                      <ul className="list-inside list-disc">{o.items.map((i, idx) => <li key={idx}>{i.quantity}× {i.name} — {formatBRL(i.unitPrice * i.quantity)}</li>)}</ul>
                    )}
                    <p className="text-xs text-muted-foreground">Produtos {formatBRL(o.productsSubtotal)} • Serviço {formatBRL(o.serviceValue)} • Desconto {formatBRL(o.discount)}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Link href={`/pedido/${o.id}`} className="inline-flex items-center gap-1.5 rounded-md bg-card px-3 py-1.5 text-xs font-semibold shadow-sm"><ExternalLink className="h-3.5 w-3.5" /> Ver pedido completo</Link>
                      {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"><MessageCircle className="h-3.5 w-3.5" /> Falar com o cliente</a>}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
