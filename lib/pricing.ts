/* =====================================================================
 * CÁLCULO DE VALORES DO PEDIDO
 * Usado no carrinho (navegador) e recalculado no servidor ao criar o
 * pedido — o servidor nunca confia em valores enviados pelo navegador.
 * ===================================================================== */
import { COMBO_DISCOUNT_RATE } from './constants';

export interface PricingLine {
  price: number;
  quantity: number;
}

export interface Totals {
  productsSubtotal: number;
  serviceValue: number;
  subtotal: number;
  discount: number;
  total: number;
  discountApplied: boolean;
}

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * REGRA DE DESCONTO (informada pela JC Resolve):
 *   produtos da Loja + prestação de serviço no MESMO pedido = 10% de desconto.
 * - Só produtos  → sem desconto.
 * - Só serviço   → sem desconto.
 * - Produtos + serviço → 10% sobre o subtotal (produtos + serviço).
 * Nenhum outro desconto ou promoção existe no sistema.
 */
export function computeTotals(products: PricingLine[], servicePrice: number | null): Totals {
  const productsSubtotal = round2(
    (products ?? []).reduce((sum: number, p: PricingLine) => sum + Number(p?.price ?? 0) * Number(p?.quantity ?? 0), 0),
  );
  const serviceValue = round2(Number(servicePrice ?? 0));
  const hasProducts = productsSubtotal > 0;
  const hasService = servicePrice !== null && serviceValue > 0;
  const subtotal = round2(productsSubtotal + serviceValue);
  const discountApplied = hasProducts && hasService;
  const discount = discountApplied ? round2(subtotal * COMBO_DISCOUNT_RATE) : 0;
  return { productsSubtotal, serviceValue, subtotal, discount, total: round2(subtotal - discount), discountApplied };
}
