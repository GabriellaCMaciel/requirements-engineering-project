/* Admin edita, liga/desliga ou exclui um produto da Loja */
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { parseProductInput } from '@/lib/admin-products';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 });
  return null;
}

/* PATCH: se vier só { available }, apenas liga/desliga; se vier o formulário completo, edita o produto */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const onlyToggle = Object.keys(body ?? {}).length === 1 && 'available' in body;
    if (onlyToggle) {
      await prisma.product.update({ where: { id }, data: { available: Boolean(body.available) } });
      return NextResponse.json({ ok: true });
    }
    const parsed = parseProductInput(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const d = parsed.data;
    await prisma.product.update({ where: { id }, data: { ...d, images: [d.image], isDemo: false } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Erro ao alterar produto:', err);
    return NextResponse.json({ error: 'Não foi possível alterar o produto.' }, { status: 500 });
  }
}

/* DELETE: exclui de vez. Se o produto já foi vendido (existe em pedidos), apenas oculta da Loja
 * para não quebrar o histórico de pedidos. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const inOrders = await prisma.orderItem.count({ where: { productId: id } });
    if (inOrders > 0) {
      await prisma.product.update({ where: { id }, data: { available: false } });
      return NextResponse.json({ ok: true, hidden: true });
    }
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true, hidden: false });
  } catch (err) {
    console.error('Erro ao excluir produto:', err);
    return NextResponse.json({ error: 'Não foi possível excluir o produto.' }, { status: 500 });
  }
}
