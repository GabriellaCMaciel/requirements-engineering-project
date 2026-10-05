/* Admin ativa/desativa a disponibilidade (demonstrativa) de um produto */
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 });
  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    await prisma.product.update({ where: { id }, data: { available: Boolean(body?.available) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Erro ao alterar produto:', err);
    return NextResponse.json({ error: 'Não foi possível alterar o produto.' }, { status: 500 });
  }
}
