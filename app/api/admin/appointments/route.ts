/* Admin cria um agendamento manualmente (ex.: pedido recebido por telefone).
 * Passa pela mesma proteção contra conflito de horário. */
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { CONFLICT_MESSAGE } from '@/lib/constants';
import { parseAdminAppointment } from '@/lib/appointment-input';
import { assertNoConflict, ConflictError } from '@/lib/scheduling-server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 });

  try {
    const body = await req.json().catch(() => ({}));
    const { data, error } = parseAdminAppointment(body ?? {});
    if (!data) return NextResponse.json({ error }, { status: 400 });

    const created = await prisma.$transaction(async (tx) => {
      if (data.status !== 'CANCELADO') {
        await assertNoConflict(tx, { professional: data.professional, date: data.date, startMin: data.startMin, endMin: data.endMin }, CONFLICT_MESSAGE);
      }
      return tx.appointment.create({ data });
    });
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (err) {
    if (err instanceof ConflictError) return NextResponse.json({ error: err.message, conflict: true }, { status: 409 });
    console.error('Erro ao criar agendamento:', err);
    return NextResponse.json({ error: 'Não foi possível criar o agendamento.' }, { status: 500 });
  }
}
