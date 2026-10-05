/* Verificação de credenciais (usada pelo formulário para mostrar erros claros).
 * O login de fato (criação da sessão) é feito pelo signIn() do Auth.js. */
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');
    const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
    const ok = user?.password ? await bcrypt.compare(password, user.password) : false;
    if (!ok) return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
    return NextResponse.json({ ok: true, role: user?.role ?? 'CLIENT' });
  } catch (err) {
    console.error('Erro no login:', err);
    return NextResponse.json({ error: 'Erro ao validar login.' }, { status: 500 });
  }
}
