/* Admin altera o status de um pedido da loja */
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { ORDER_STATUS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 });
  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const status = String(body?.status ?? '');
    if (!ORDER_STATUS[status]) return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
    await prisma.order.update({ where: { id }, data: { status } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Erro ao alterar pedido:', err);
    return NextResponse.json({ error: 'Não foi possível alterar o pedido.' }, { status: 500 });
  }
}
