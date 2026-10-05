/* =====================================================================
 * EDITAR / REAGENDAR / CANCELAR AGENDAMENTO
 * - Cliente: só mexe nos PRÓPRIOS agendamentos (reagendar ou cancelar).
 * - Admin: pode alterar todos os campos e o status.
 * Toda mudança de data, horário ou profissional volta a validar conflito.
 * ===================================================================== */
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { EDIT_CONFLICT_MESSAGE, WORK_END_MIN, WORK_START_MIN } from '@/lib/constants';
import { parseAdminAppointment } from '@/lib/appointment-input';
import { nowMinutesBR, todayISO } from '@/lib/scheduling';
import { assertNoConflict, ConflictError } from '@/lib/scheduling-server';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  const { id } = await params;

  try {
    const current = await prisma.appointment.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 });

    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = current.userId === session.user.id;
    if (!isAdmin && !isOwner) return NextResponse.json({ error: 'Você não tem acesso a este agendamento.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    let next: Record<string, unknown>;

    if (isAdmin) {
      // Admin: payload completo. Campos ausentes mantêm o valor atual.
      const merged = { ...current, ...(body ?? {}) } as Record<string, unknown>;
      const { data, error } = parseAdminAppointment(merged);
      if (!data) return NextResponse.json({ error }, { status: 400 });
      next = { ...data };
    } else {
      // Cliente: apenas cancelar ou reagendar enquanto o atendimento não começou
      if (!['AGENDADO', 'CONFIRMADO'].includes(current.status)) {
        return NextResponse.json({ error: 'Este agendamento não pode mais ser alterado pelo site. Fale com a JC Resolve pelo WhatsApp.' }, { status: 400 });
      }
      if (body?.action === 'cancel') {
        next = { status: 'CANCELADO' };
      } else if (body?.action === 'reschedule') {
        const date = String(body?.date ?? '');
        const startMin = Math.floor(Number(body?.startMin));
        const duration = current.endMin - current.startMin; // mantém a duração do serviço
        const endMin = startMin + duration;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < todayISO()) return NextResponse.json({ error: 'Escolha uma data a partir de hoje.' }, { status: 400 });
        if (!Number.isFinite(startMin) || startMin < WORK_START_MIN || endMin > WORK_END_MIN) return NextResponse.json({ error: 'Horário fora da janela demonstrativa.' }, { status: 400 });
        if (date === todayISO() && startMin <= nowMinutesBR()) return NextResponse.json({ error: 'Esse horário já passou.' }, { status: 400 });
        // Reagendamento volta para "Agendado" para o admin confirmar de novo
        next = { date, startMin, endMin, status: 'AGENDADO' };
      } else {
        return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const finalState = { ...current, ...next } as typeof current;
      // Só agendamentos ativos ocupam a agenda — então só eles precisam de validação
      if (finalState.status !== 'CANCELADO') {
        await assertNoConflict(
          tx,
          { id: current.id, professional: finalState.professional, date: finalState.date, startMin: finalState.startMin, endMin: finalState.endMin },
          EDIT_CONFLICT_MESSAGE,
        );
      }
      return tx.appointment.update({ where: { id }, data: next });
    });

    return NextResponse.json({ ok: true, id: updated.id });
  } catch (err) {
    if (err instanceof ConflictError) return NextResponse.json({ error: err.message, conflict: true }, { status: 409 });
    console.error('Erro ao alterar agendamento:', err);
    return NextResponse.json({ error: 'Não foi possível alterar o agendamento.' }, { status: 500 });
  }
}
