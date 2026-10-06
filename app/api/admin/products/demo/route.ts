/* Admin carrega o catálogo de exemplo (útil quando a Loja está vazia e não dá para rodar o seed).
 * Usa upsert: nunca duplica nem apaga produtos que já existem. As fotos são as da área de serviço. */
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { DEMO_PRODUCTS } from '@/lib/catalog-data';
import { SERVICE_AREAS, type ServiceArea } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 });
  try {
    for (const p of DEMO_PRODUCTS) {
      const image = SERVICE_AREAS[p.serviceArea as ServiceArea]?.image ?? p.image;
      // `update: {}` preserva edições já feitas pelo administrador em produtos de exemplo
      await prisma.product.upsert({ where: { id: p.id }, update: {}, create: { ...p, image, images: [image], isDemo: true } });
    }
    return NextResponse.json({ ok: true, count: DEMO_PRODUCTS.length });
  } catch (err) {
    console.error('Erro ao carregar catálogo de exemplo:', err);
    return NextResponse.json({ error: 'Não foi possível carregar os produtos de exemplo.' }, { status: 500 });
  }
}
