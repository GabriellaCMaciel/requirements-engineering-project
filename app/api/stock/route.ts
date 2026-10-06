/* Estoque atual dos produtos (público): o carrinho usa para limitar as quantidades. GET /api/stock?ids=a,b,c */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get('ids') ?? '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 100);
  if (ids.length === 0) return NextResponse.json({ stock: {} });
  try {
    const rows = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, stock: true, available: true } });
    return NextResponse.json({ stock: Object.fromEntries(rows.map((r) => [r.id, r.available ? r.stock : 0])) });
  } catch (err) {
    console.error('Erro ao consultar estoque:', err);
    return NextResponse.json({ stock: {} });
  }
}
