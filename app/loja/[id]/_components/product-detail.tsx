'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Info, Minus, PackageCheck, PackageX, Plus, ShoppingCart, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/components/cart-provider';
import { formatBRL } from '@/lib/constants';
import type { ProductDTO } from '@/lib/products';

export function ProductDetail({ product }: { product: ProductDTO }) {
  const router = useRouter();
  const { addProduct } = useCart();
  const gallery = (product?.images?.length ?? 0) > 0 ? product.images : [product.image];
  const [active, setActive] = useState(gallery?.[0] ?? product.image);
  const [qty, setQty] = useState(1);

  const add = (goToCart: boolean) => {
    addProduct({ productId: product.id, name: product.name, price: product.price, image: product.image }, qty);
    toast.success(`${qty}x ${product.name} adicionado(s) ao carrinho.`);
    if (goToCart) router.push('/carrinho');
  };

  return (
    <div className="card-jc mt-4 grid gap-8 p-4 sm:p-8 md:grid-cols-2">
      <div>
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <Image src={active} alt={`Foto do produto ${product.name}`} fill priority sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
        </div>
        {gallery.length > 1 && (
          <div className="mt-3 flex gap-2">
            {gallery.map((img, i) => (
              <button key={img} type="button" onClick={() => setActive(img)} aria-label={`Ver imagem ${i + 1}`} className={`relative h-16 w-16 overflow-hidden rounded-md bg-muted ring-2 ${active === img ? 'ring-deep' : 'ring-transparent'}`}>
                <Image src={img} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <span className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-semibold">{product.category}</span>
        <h1 className="font-display text-3xl font-extrabold">{product.name}</h1>
        <p className="text-muted-foreground">{product.description}</p>
        <p className="font-display text-4xl font-extrabold">{formatBRL(product.price)}</p>
        <p className={`flex items-center gap-1.5 text-sm font-medium ${product.available ? 'text-success' : 'text-destructive'}`}>
          {product.available ? <PackageCheck className="h-4 w-4" /> : <PackageX className="h-4 w-4" />}
          {product.available ? 'Disponibilidade demonstrativa' : 'Indisponível no momento'}
        </p>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" id="qtd-label">Quantidade</span>
          <div className="flex items-center rounded-lg bg-muted shadow-sm" role="group" aria-labelledby="qtd-label">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuir quantidade" className="grid h-11 w-11 place-items-center hover:bg-accent"><Minus className="h-4 w-4" /></button>
            <span className="w-10 text-center font-bold" aria-live="polite">{qty}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="Aumentar quantidade" className="grid h-11 w-11 place-items-center hover:bg-accent"><Plus className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" disabled={!product.available} onClick={() => add(false)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-sm hover:brightness-95 hover:shadow-md disabled:opacity-40">
            <ShoppingCart className="h-5 w-5" /> Adicionar ao carrinho
          </button>
          <button type="button" disabled={!product.available} onClick={() => add(true)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-3.5 font-bold text-secondary-foreground hover:bg-navy disabled:opacity-40">
            <Zap className="h-5 w-5" /> Comprar agora
          </button>
        </div>
        <p className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" /> Agende um serviço no mesmo pedido e ganhe 10% de desconto. Produto e preço demonstrativos.
        </p>
      </div>
    </div>
  );
}
