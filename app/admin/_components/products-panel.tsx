'use client';

/* Produtos (disponibilidade) e tabela dos tipos de serviço */
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Clock, Info, Package, Wrench } from 'lucide-react';
import { formatBRL, SERVICE_TYPE_KEYS, SERVICE_TYPES } from '@/lib/constants';
import type { AdminProduct } from './types';

export function ProductsPanel({ products }: { products: AdminProduct[] }) {
  const router = useRouter();
  const [savingId, setSavingId] = useState('');

  const toggle = async (p: AdminProduct) => {
    setSavingId(p.id);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ available: !p.available }) });
      if (!res.ok) throw new Error('Não foi possível alterar o produto.');
      toast.success(`${p.name}: ${p.available ? 'indisponível na Loja' : 'disponível na Loja'}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro.');
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="space-y-6">
      <section className="card-jc p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Wrench className="h-5 w-5 text-deep" /> Tipos de agendamento</h2>
        <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Valores e durações de simulação. Para alterar, edite o arquivo <code>lib/constants.ts</code> (SERVICE_TYPES).</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {SERVICE_TYPE_KEYS.map((k) => (
            <div key={k} className="rounded-lg bg-muted p-4">
              <p className="font-bold">{SERVICE_TYPES[k].label}</p>
              <p className="font-display text-2xl font-extrabold">{formatBRL(SERVICE_TYPES[k].price)}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {SERVICE_TYPES[k].durationMin} min de agenda</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card-jc p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Package className="h-5 w-5 text-deep" /> Produtos da Loja <span className="badge-sim">demonstrativos</span></h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-lg bg-muted p-2.5 text-sm">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-card">
                {p.image ? <Image src={p.image} alt={p.name} fill sizes="48px" className="object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.category} • {formatBRL(p.price)}</p>
              </div>
              <button type="button" role="switch" aria-checked={p.available} aria-label={`Disponibilidade de ${p.name}`} disabled={savingId === p.id} onClick={() => toggle(p)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${p.available ? 'bg-success' : 'bg-slate-300'} disabled:opacity-60`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${p.available ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
