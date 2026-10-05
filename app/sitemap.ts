export const dynamic = 'force-dynamic'
import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? '';
  const base = host ? `https://${host}` : (process.env.NEXTAUTH_URL ?? '');
  const pages = ['', '/servicos', '/loja', '/carrinho', '/login', '/cadastro'].map((p) => ({ url: `${base}${p}` }));
  try {
    const products = await prisma.product.findMany({ where: { available: true }, select: { id: true } });
    return [...pages, ...products.map((p) => ({ url: `${base}/loja/${p.id}` }))];
  } catch (err) {
    console.error(err);
    return pages;
  }
}
