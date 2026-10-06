/* Admin cria um produto novo na Loja */
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { makeProductId, parseProductInput } from '@/lib/admin-products';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 });

  const parsed = parseProductInput(await req.json().catch(() => ({})));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const d = parsed.data;
    const product = await prisma.product.create({
      data: { id: makeProductId(d.name), ...d, images: [d.image], isDemo: false },
    });
    return NextResponse.json({ ok: true, id: product.id });
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    return NextResponse.json({ error: 'Não foi possível criar o produto.' }, { status: 500 });
  }
}
