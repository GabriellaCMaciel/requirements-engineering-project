/* PÁGINA INDIVIDUAL DO PRODUTO */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getProducts } from '@/lib/products';
import { ProductCard } from '@/components/product-card';
import { ProductDetail } from './_components/product-detail';

export const dynamic = 'force-dynamic';

export default async function ProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const products = await getProducts();
  const product = products.find((p) => p.id === id);
  if (!product) notFound();
  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);

  return (
    <div className="bg-muted py-8">
      <div className="container-jc">
        <Link href="/loja" className="inline-flex items-center gap-1 text-sm font-semibold text-deep hover:underline"><ChevronLeft className="h-4 w-4" /> Voltar para a Loja</Link>
        <ProductDetail product={product} />
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-extrabold">Produtos relacionados</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
