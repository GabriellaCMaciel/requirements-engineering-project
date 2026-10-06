'use client';

/* =====================================================================
 * CARRINHO — ARMAZENAMENTO LOCAL DE PROTÓTIPO (localStorage)
 * O carrinho fica salvo apenas NESTE navegador até o pedido ser
 * confirmado. Isso NÃO é sincronização online: os pedidos, contas e
 * agendamentos confirmados ficam no banco de dados do servidor.
 *
 * O carrinho guarda duas coisas:
 *  - products: itens da Loja (com quantidade)
 *  - service : o serviço a agendar (vem do quiz ou da página Serviços)
 * ===================================================================== */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SERVICE_TYPES, ServiceArea, ServiceType } from '@/lib/constants';
import { computeTotals, Totals } from '@/lib/pricing';

const STORAGE_KEY = 'jcresolve_cart_v1';

export interface CartProduct {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock?: number; // estoque conhecido (atualizado ao abrir o carrinho); limita a quantidade
}

export interface CartService {
  area: ServiceArea;
  problemDescription: string; // descrição original do cliente (preservada)
  serviceType: ServiceType;
}

interface CartState {
  products: CartProduct[];
  service: CartService | null;
}

interface CartContextValue extends CartState {
  ready: boolean; // true depois de ler o localStorage (evita erro de hidratação)
  count: number;
  totals: Totals;
  addProduct: (p: Omit<CartProduct, 'quantity'>, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  setService: (s: CartService | null) => void;
  updateService: (patch: Partial<CartService>) => void;
  clear: () => void;
}

const EMPTY: CartState = { products: [], service: null };
const CartContext = createContext<CartContextValue | null>(null);

/** Máximo por produto: o estoque (se conhecido), no máximo 99 */
function maxOf(stock?: number): number {
  return typeof stock === 'number' ? Math.max(1, Math.min(99, stock)) : 99;
}

/** Lê o carrinho salvo com segurança (JSON inválido vira carrinho vazio) */
function readStorage(): CartState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw ?? 'null');
    return {
      products: Array.isArray(parsed?.products) ? parsed.products : [],
      service: parsed?.service ?? null,
    };
  } catch {
    return EMPTY;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>(EMPTY);
  const [ready, setReady] = useState(false);

  // 1) Ao abrir o site: carrega o carrinho salvo
  useEffect(() => {
    setState(readStorage());
    setReady(true);
  }, []);

  // 1.1) Sincroniza o estoque atual (o admin pode ter alterado): atualiza o limite e ajusta quantidades acima dele
  useEffect(() => {
    if (!ready) return;
    const ids = state.products.map((p) => p.productId);
    if (ids.length === 0) return;
    let cancelled = false;
    fetch(`/api/stock?ids=${encodeURIComponent(ids.join(','))}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const stock: Record<string, number> | undefined = data?.stock;
        if (cancelled || !stock) return;
        setState((prev) => ({
          ...prev,
          products: prev.products.map((it) => (it.productId in stock ? { ...it, stock: stock[it.productId], quantity: Math.min(it.quantity, maxOf(stock[it.productId])) } : it)),
        }));
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // roda ao abrir o site e quando muda a lista de produtos (não a cada alteração de quantidade)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, state.products.map((p) => p.productId).join(',')]);

  // 2) A cada mudança: salva de novo no localStorage
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Não foi possível salvar o carrinho:', err);
    }
  }, [state, ready]);

  const addProduct = useCallback((p: Omit<CartProduct, 'quantity'>, quantity = 1) => {
    setState((prev) => {
      const exists = prev.products.find((it) => it.productId === p.productId);
      const products = exists
        ? prev.products.map((it) => (it.productId === p.productId ? { ...it, stock: p.stock ?? it.stock, quantity: Math.min(maxOf(p.stock ?? it.stock), it.quantity + quantity) } : it))
        : [...prev.products, { ...p, quantity: Math.min(maxOf(p.stock), Math.max(1, quantity)) }];
      return { ...prev, products };
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((it) => (it.productId === productId ? { ...it, quantity: Math.min(maxOf(it.stock), Math.max(1, Math.floor(quantity || 1))) } : it)),
    }));
  }, []);

  const removeProduct = useCallback((productId: string) => {
    setState((prev) => ({ ...prev, products: prev.products.filter((it) => it.productId !== productId) }));
  }, []);

  const setService = useCallback((s: CartService | null) => setState((prev) => ({ ...prev, service: s })), []);
  const updateService = useCallback(
    (patch: Partial<CartService>) => setState((prev) => (prev.service ? { ...prev, service: { ...prev.service, ...patch } } : prev)),
    [],
  );
  const clear = useCallback(() => setState(EMPTY), []);

  // Valores recalculados automaticamente a cada alteração (inclui a regra dos 10%)
  const totals = useMemo(
    () =>
      computeTotals(
        state.products.map((p) => ({ price: p.price, quantity: p.quantity })),
        state.service ? SERVICE_TYPES[state.service.serviceType]?.price ?? 0 : null,
      ),
    [state],
  );
  const count = state.products.reduce((n, p) => n + p.quantity, 0) + (state.service ? 1 : 0);

  const value: CartContextValue = { ...state, ready, count, totals, addProduct, setQuantity, removeProduct, setService, updateService, clear };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart precisa estar dentro de <CartProvider>');
  return ctx;
}
