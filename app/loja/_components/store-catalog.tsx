'use client';

/* Catálogo com busca por texto, filtro de categoria, disponibilidade e ordenação */
import { useMemo, useState } from 'react';
import { PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { normalizeText } from '@/lib/quiz';
import type { ProductDTO } from '@/lib/products';

type Sort = 'relevancia' | 'menor' | 'maior' | 'nome';

export function StoreCatalog({ products }: { products: ProductDTO[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState<Sort>('relevancia');

  const categories = useMemo(() => ['Todas', ...Array.from(new Set((products ?? []).map((p) => p.category)))], [products]);

  const filtered = useMemo(() => {
    const q = normalizeText(query.trim());
    const list = (products ?? []).filter((p) => {
      if (category !== 'Todas' && p.category !== category) return false;
      if (onlyAvailable && !p.available) return false;
      if (!q) return true;
      const haystack = normalizeText(`${p.name} ${p.description} ${p.category} ${(p.tags ?? []).join(' ')}`);
      return haystack.includes(q);
    });
    if (sort === 'menor') return [...list].sort((a, b) => a.price - b.price);
    if (sort === 'maior') return [...list].sort((a, b) => b.price - a.price);
    if (sort === 'nome') return [...list].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return list;
  }, [products, query, category, onlyAvailable, sort]);

  const reset = () => { setQuery(''); setCategory('Todas'); setOnlyAvailable(false); setSort('relevancia'); };

  return (
    <section className="bg-muted py-10">
      <div className="container-jc">
        <div className="card-jc grid gap-3 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="busca" className="sr-only">Buscar produtos</label>
            <input id="busca" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar: lâmpada, torneira, ar-condicionado..." className="field pl-10" />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <label htmlFor="ordem" className="sr-only">Ordenar</label>
            <select id="ordem" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field h-11 w-full md:w-48">
              <option value="relevancia">Relevância</option>
              <option value="menor">Menor preço</option>
              <option value="maior">Maior preço</option>
              <option value="nome">Nome (A–Z)</option>
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--deep))]" />
            Somente disponíveis
          </label>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Categorias">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${category === c ? 'bg-secondary text-secondary-foreground shadow' : 'bg-card text-foreground shadow-sm hover:bg-accent'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{filtered.length} produto(s) encontrado(s)</p>

        {filtered.length === 0 ? (
          <div className="card-jc mt-4 flex flex-col items-center gap-3 p-10 text-center">
            <PackageSearch className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">Nenhum produto encontrado com esses filtros.</p>
            <button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"><X className="h-4 w-4" /> Limpar filtros</button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </section>
  );
}
