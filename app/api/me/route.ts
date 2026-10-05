/* Dados do cliente logado (usado para pré-preencher o checkout).
 * Retorna SOMENTE os dados da própria conta. */
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, cep: true, role: true },
  });
  if (!user) return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 404 });
  return NextResponse.json(user);
}
