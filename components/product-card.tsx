'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ImageOff, PackageCheck, PackageX, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from './cart-provider';
import { formatBRL } from '@/lib/constants';
import type { ProductDTO } from '@/lib/products';

/* Card de produto reutilizado na Home, Loja e sugestões */
export function ProductCard({ product }: { product: ProductDTO }) {
  const { addProduct } = useCart();
  const [imgError, setImgError] = useState(false);

  const inStock = product.available && product.stock > 0;
  const handleAdd = () => {
    if (!inStock) return;
    addProduct({ productId: product.id, name: product.name, price: product.price, image: product.image, stock: product.stock });
    toast.success(`${product.name} adicionado ao carrinho.`);
  };

  return (
    <article className="card-jc group flex flex-col overflow-hidden hover:shadow-[0_10px_30px_-8px_rgba(8,26,48,0.25)] animate-fade-in">
      <Link href={`/loja/${product.id}`} className="relative block aspect-square bg-muted" aria-label={`Ver detalhes de ${product.name}`}>
        {imgError ? (
          <div className="grid h-full place-items-center text-muted-foreground"><ImageOff className="h-8 w-8" /></div>
        ) : (
          <Image src={product.image} alt={`Foto do produto ${product.name}`} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover transition-transform duration-slow group-hover:scale-105" onError={() => setImgError(true)} />
        )}
        <span className="absolute left-2 top-2 rounded-full bg-navy/85 px-2.5 py-1 text-[11px] font-semibold text-white">{product.category}</span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/loja/${product.id}`} className="line-clamp-2 font-display text-[15px] font-bold leading-snug hover:underline">
          {product.name}
        </Link>
        <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="font-display text-lg font-extrabold">{formatBRL(product.price)}</p>
            <p className={`flex items-center gap-1 text-[11px] font-medium ${inStock ? 'text-success' : 'text-destructive'}`}>
              {inStock ? <PackageCheck className="h-3.5 w-3.5" /> : <PackageX className="h-3.5 w-3.5" />}
              {!product.available ? 'Indisponível' : product.stock <= 0 ? 'Sem estoque' : `${product.stock} em estoque`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inStock}
            aria-label={`Adicionar ${product.name} ao carrinho`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm transition hover:brightness-95 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
