/* Admin altera o status de um pedido da loja.
 * ESTOQUE: quando o pedido passa a "pago" (Pagamento confirmado ou adiante) o estoque dos produtos
 * é baixado; se voltar para "Aguardando pagamento" ou "Cancelado", o estoque é devolvido.
 * Isso garante que cada pedido baixe o estoque no máximo uma vez. */
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { ORDER_STATUS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const PAID = new Set(['PAGAMENTO_CONFIRMADO', 'EM_PREPARACAO', 'ENVIADO', 'ENTREGUE']);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 });
  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const status = String(body?.status ?? '');
    if (!ORDER_STATUS[status]) return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });

    const lowStock: string[] = [];
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!order) throw new Error('NOT_FOUND');
      const wasPaid = PAID.has(order.status);
      const willBePaid = PAID.has(status);
      if (!wasPaid && willBePaid) {
        for (const it of order.items) {
          const p = await tx.product.findUnique({ where: { id: it.productId } });
          if (!p) continue;
          const newStock = Math.max(0, p.stock - it.quantity);
          if (p.stock < it.quantity) lowStock.push(p.name);
          await tx.product.update({ where: { id: p.id }, data: { stock: newStock } });
        }
      } else if (wasPaid && !willBePaid) {
        for (const it of order.items) {
          await tx.product.updateMany({ where: { id: it.productId }, data: { stock: { increment: it.quantity } } });
        }
      }
      await tx.order.update({ where: { id }, data: { status } });
    });
    return NextResponse.json({ ok: true, lowStock });
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_FOUND') return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    console.error('Erro ao alterar pedido:', err);
    return NextResponse.json({ error: 'Não foi possível alterar o pedido.' }, { status: 500 });
  }
}
