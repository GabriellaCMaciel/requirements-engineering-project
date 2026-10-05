/* =====================================================================
 * VALIDAÇÃO DE CONFLITO NO SERVIDOR (fonte da verdade)
 * Mesmo que o navegador já tenha verificado, o servidor verifica de novo
 * dentro de uma transação com "trava" por profissional + data. Assim,
 * dois clientes clicando ao mesmo tempo não conseguem pegar o mesmo horário.
 * ===================================================================== */
import { Prisma } from '@prisma/client';
import { findConflict, TimeInterval } from './scheduling';

export class ConflictError extends Error {}

/**
 * Deve ser chamada DENTRO de prisma.$transaction(async (tx) => ...).
 * 1. pega uma trava (advisory lock) para o par profissional+data;
 * 2. busca os agendamentos ativos daquele profissional naquele dia;
 * 3. aplica a mesma regra de sobreposição usada no navegador.
 */
export async function assertNoConflict(tx: Prisma.TransactionClient, candidate: TimeInterval, message: string): Promise<void> {
  const lockKey = `appt:${candidate.professional}:${candidate.date}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

  const sameDay = await tx.appointment.findMany({
    where: { professional: candidate.professional, date: candidate.date, status: { not: 'CANCELADO' } },
    select: { id: true, professional: true, date: true, startMin: true, endMin: true, status: true },
  });

  const conflict = findConflict(candidate, sameDay);
  if (conflict) throw new ConflictError(message);
}

/** Código de pedido legível e único: JC-AAMMDD-XXXX */
export function generateOrderCode(): string {
  const now = new Date();
  const ymd = `${String(now.getUTCFullYear()).slice(2)}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `JC-${ymd}-${rand}`;
}
