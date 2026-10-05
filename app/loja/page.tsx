/* LOJA — área independente com catálogo, busca e filtros */
import { Info, ShoppingBag } from 'lucide-react';
import { getProducts } from '@/lib/products';
import { StoreCatalog } from './_components/store-catalog';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Loja | JC Resolve' };

export default async function LojaPage() {
  const products = await getProducts();
  return (
    <>
      <section className="bg-navy py-12 text-white">
        <div className="container-jc">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ShoppingBag className="h-4 w-4" /> Loja JC Resolve</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">Produtos para manutenção</h1>
          <p className="mt-2 max-w-2xl text-white/75">Encontre materiais elétricos, hidráulicos, de refrigeração e ferragens. Agende um serviço no mesmo pedido e ganhe 10% de desconto.</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-xs text-white/80"><Info className="h-3.5 w-3.5" /> Catálogo demonstrativo: produtos, imagens, preços e disponibilidade são simulações.</p>
        </div>
      </section>
      <StoreCatalog products={products} />
    </>
  );
}
