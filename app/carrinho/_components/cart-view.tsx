'use client';

/* Carrinho: adicionar/remover/alterar quantidade + serviço + valores */
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarPlus, Info, Loader2, Minus, Plus, ShoppingBag, ShoppingCart, Trash2, UserCog, Wrench } from 'lucide-react';
import { useCart } from '@/components/cart-provider';
import { OrderSummary } from '@/components/order-summary';
import { ServiceTypePicker } from '@/components/service-type-picker';
import { AREA_TO_PROFESSIONAL, formatBRL, PROFESSIONALS, SERVICE_AREAS } from '@/lib/constants';

export function CartView() {
  const router = useRouter();
  const { ready, products, service, totals, setQuantity, removeProduct, updateService, setService } = useCart();

  if (!ready) {
    return <div className="mt-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const isEmpty = (products?.length ?? 0) === 0 && !service;
  const descriptionOk = !service || (service.problemDescription ?? '').trim().length >= 3;

  if (isEmpty) {
    return (
      <div className="card-jc mt-6 flex flex-col items-center gap-4 p-10 text-center">
        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">Seu carrinho está vazio.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/#assistente" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground"><Wrench className="h-4 w-4" /> Encontrar um serviço</Link>
          <Link href="/loja" className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-3 font-bold text-secondary-foreground"><ShoppingBag className="h-4 w-4" /> Ir para a Loja</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="min-w-0 space-y-6">
        {/* SERVIÇO */}
        {service ? (
          <section className="card-jc p-5 sm:p-6" aria-labelledby="svc-title">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="svc-title" className="flex items-center gap-2 font-display text-lg font-bold"><Wrench className="h-5 w-5 text-deep" /> Serviço: {SERVICE_AREAS[service.area]?.label}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><UserCog className="h-4 w-4" /> Profissional sugerido: {PROFESSIONALS[AREA_TO_PROFESSIONAL[service.area]]?.label}</p>
              </div>
              <button type="button" onClick={() => setService(null)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-destructive hover:bg-destructive/10" aria-label="Remover serviço"><Trash2 className="h-4 w-4" /> Remover</button>
            </div>
            <label htmlFor="svc-desc" className="field-label mt-4">Descrição do problema</label>
            <textarea
              id="svc-desc"
              rows={3}
              maxLength={600}
              value={service.problemDescription}
              onChange={(e) => updateService({ problemDescription: e.target.value })}
              placeholder="Conte o que aconteceu..."
              className="w-full resize-none rounded-lg border border-input bg-muted p-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            {!descriptionOk && <p role="alert" className="mt-1 text-xs text-destructive">Descreva o problema para continuar.</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">Tipo de agendamento</p>
              <span className="badge-sim"><Info className="h-3 w-3" /> Valores de simulação</span>
            </div>
            <div className="mt-2"><ServiceTypePicker value={service.serviceType} onChange={(t) => updateService({ serviceType: t })} /></div>
            <p className="mt-3 text-xs text-muted-foreground">Data, horário e urgência são escolhidos na etapa de agendamento do checkout.</p>
          </section>
        ) : (
          <section className="card-jc flex flex-col items-start justify-between gap-3 bg-secondary p-5 text-secondary-foreground sm:flex-row sm:items-center">
            <div>
              <p className="font-display font-bold">Precisa de alguém para instalar?</p>
              <p className="text-sm text-white/75">Adicione um serviço ao pedido e ganhe 10% de desconto no total.</p>
            </div>
            <Link href="/#assistente" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"><CalendarPlus className="h-4 w-4" /> Adicionar serviço</Link>
          </section>
        )}

        {/* PRODUTOS */}
        <section className="card-jc p-5 sm:p-6" aria-labelledby="prod-title">
          <h2 id="prod-title" className="flex items-center gap-2 font-display text-lg font-bold"><ShoppingBag className="h-5 w-5 text-deep" /> Produtos</h2>
          {(products?.length ?? 0) === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nenhum produto. <Link href="/loja" className="font-semibold text-deep underline">Visitar a Loja</Link></p>
          ) : (
            <ul className="mt-4 divide-y">
              {products.map((p) => (
                <li key={p.productId} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image src={p.image} alt={p.name} fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/loja/${p.productId}`} className="line-clamp-2 text-sm font-semibold hover:underline">{p.name}</Link>
                    <p className="text-xs text-muted-foreground">{formatBRL(p.price)} cada{typeof p.stock === 'number' ? ` • ${p.stock} em estoque` : ''}</p>
                  </div>
                  <div className="flex items-center rounded-lg bg-muted" role="group" aria-label={`Quantidade de ${p.name}`}>
                    <button type="button" onClick={() => (p.quantity <= 1 ? removeProduct(p.productId) : setQuantity(p.productId, p.quantity - 1))} aria-label="Diminuir" className="grid h-9 w-9 place-items-center hover:bg-accent"><Minus className="h-3.5 w-3.5" /></button>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, Math.min(99, p.stock ?? 99))}
                      value={p.quantity}
                      onChange={(e) => setQuantity(p.productId, Number(e.target.value))}
                      aria-label="Quantidade"
                      className="w-10 bg-transparent text-center text-sm font-bold [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button type="button" onClick={() => setQuantity(p.productId, p.quantity + 1)} disabled={p.quantity >= Math.min(99, p.stock ?? 99)} aria-label="Aumentar" className="grid disabled:opacity-40 h-9 w-9 place-items-center hover:bg-accent"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <p className="w-24 text-right text-sm font-bold">{formatBRL(p.price * p.quantity)}</p>
                  <button type="button" onClick={() => removeProduct(p.productId)} aria-label={`Remover ${p.name}`} className="grid h-9 w-9 place-items-center rounded-md text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* RESUMO */}
      <aside className="card-jc p-5 sm:p-6 lg:sticky lg:top-24" aria-label="Resumo do pedido">
        <h2 className="mb-4 font-display text-lg font-bold">Resumo</h2>
        <OrderSummary totals={totals} hasProducts={(products?.length ?? 0) > 0} hasService={!!service} />
        <button
          type="button"
          disabled={!descriptionOk}
          onClick={() => router.push('/checkout')}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 font-bold text-primary-foreground shadow-sm hover:brightness-95 hover:shadow-md disabled:opacity-40"
        >
          Continuar para o checkout <ArrowRight className="h-4 w-4" />
        </button>
        <Link href="/loja" className="mt-3 block text-center text-sm font-semibold text-deep hover:underline">Continuar comprando</Link>
      </aside>
    </div>
  );
}
