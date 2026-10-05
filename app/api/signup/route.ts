/* Cadastro curto: nome completo, e-mail, telefone, senha e CEP.
 * O endereço completo só é pedido depois, no checkout. */
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? body?.fullName ?? '').trim();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const phone = String(body?.phone ?? '').replace(/\D/g, '');
    const cep = String(body?.cep ?? '').replace(/\D/g, '');
    const password = String(body?.password ?? '');

    if (name.length < 3) return NextResponse.json({ error: 'Informe seu nome completo.' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
    if (phone.length < 10) return NextResponse.json({ error: 'Telefone inválido. Use DDD + número.' }, { status: 400 });
    if (cep.length !== 8) return NextResponse.json({ error: 'CEP inválido. Use 8 dígitos.' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: 'Já existe uma conta com este e-mail.' }, { status: 409 });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, phone, cep, password: hash, role: 'CLIENT' } });
    return NextResponse.json({ ok: true, id: user.id }, { status: 201 });
  } catch (err) {
    console.error('Erro no cadastro:', err);
    return NextResponse.json({ error: 'Não foi possível concluir o cadastro.' }, { status: 500 });
  }
}
