/* Horários OCUPADOS de um profissional em uma data.
 * Retorna apenas os intervalos (sem dados de clientes), para o navegador
 * desabilitar horários conflitantes antes mesmo de enviar o pedido. */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PROFESSIONAL_KEYS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const professional = url.searchParams.get('professional') ?? '';
    const date = url.searchParams.get('date') ?? '';
    const excludeId = url.searchParams.get('excludeId') ?? '';
    if (!PROFESSIONAL_KEYS.includes(professional as (typeof PROFESSIONAL_KEYS)[number]) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
    }
    const busy = await prisma.appointment.findMany({
      where: { professional, date, status: { not: 'CANCELADO' }, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { startMin: true, endMin: true },
      orderBy: { startMin: 'asc' },
    });
    return NextResponse.json({ busy: busy.map((b) => ({ professional, date, startMin: b.startMin, endMin: b.endMin })) });
  } catch (err) {
    console.error('Erro ao consultar disponibilidade:', err);
    return NextResponse.json({ error: 'Erro ao consultar disponibilidade.' }, { status: 500 });
  }
}
