import { BadgePercent, Info } from 'lucide-react';
import { formatBRL } from '@/lib/constants';
import type { Totals } from '@/lib/pricing';

/** Bloco de valores: subtotal, serviço, desconto e total (usado no carrinho e checkout) */
export function OrderSummary({ totals, hasProducts, hasService }: { totals: Totals; hasProducts: boolean; hasService: boolean }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between"><dt className="text-muted-foreground">Produtos</dt><dd className="font-medium">{formatBRL(totals.productsSubtotal)}</dd></div>
      <div className="flex justify-between"><dt className="text-muted-foreground">Serviço <span className="text-[11px]">(simulação)</span></dt><dd className="font-medium">{formatBRL(totals.serviceValue)}</dd></div>
      <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-medium">{formatBRL(totals.subtotal)}</dd></div>
      <div className={`flex justify-between gap-2 ${totals.discountApplied ? 'text-success' : 'text-muted-foreground'}`}>
        <dt className="flex min-w-0 items-start gap-1"><BadgePercent className="mt-0.5 h-4 w-4 shrink-0" /> <span>Desconto produtos + serviço (10%)</span></dt>
        <dd className="shrink-0 whitespace-nowrap font-semibold">− {formatBRL(totals.discount)}</dd>
      </div>
      <div className="flex justify-between border-t pt-3 text-base"><dt className="font-bold">Total</dt><dd className="font-display text-xl font-extrabold">{formatBRL(totals.total)}</dd></div>
      {!totals.discountApplied && (hasProducts || hasService) && (
        <p className="flex items-start gap-1.5 rounded-md bg-muted p-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {hasProducts ? 'Adicione um serviço ao pedido para ganhar 10% de desconto.' : 'Adicione produtos da Loja ao pedido para ganhar 10% de desconto.'}
        </p>
      )}
    </dl>
  );
}
