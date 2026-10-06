/* Admin edita nome, preço, duração e descrição de um tipo de serviço */
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { SERVICE_TYPE_KEYS } from '@/lib/constants';
import { parseServiceTypeInput } from '@/lib/service-types';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 });
  const { key } = await params;
  if (!(SERVICE_TYPE_KEYS as readonly string[]).includes(key)) return NextResponse.json({ error: 'Tipo de serviço inválido.' }, { status: 400 });

  const parsed = parseServiceTypeInput(await req.json().catch(() => ({})));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    await prisma.serviceTypeConfig.upsert({ where: { key }, update: parsed.data, create: { key, ...parsed.data } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Erro ao salvar tipo de serviço:', err);
    return NextResponse.json({ error: 'Não foi possível salvar. Tente novamente.' }, { status: 500 });
  }
}
