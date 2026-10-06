/* Popula o banco com: conta admin mestre, conta de testes, catálogo
 * demonstrativo e alguns agendamentos DEMONSTRATIVOS (simulação).
 * Usa upsert para nunca duplicar nem apagar dados. */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEMO_PRODUCTS } from '../lib/catalog-data';
import { addDays, todayISO } from '../lib/scheduling';

const prisma = new PrismaClient();

async function upsertUser(email: string, password: string, name: string, role: string) {
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { role, password: hash },
    create: { email, password: hash, name, role, phone: '61996089673', cep: '72870000' },
  });
}

async function main() {
  // O administrador vem do .env (nunca escreva senhas neste arquivo: o repositório é público).
  //   ADMIN_EMAIL=...  ADMIN_PASSWORD=...  (mínimo de 10 caracteres)
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 10) throw new Error('ADMIN_PASSWORD deve ter pelo menos 10 caracteres.');
    await upsertUser(adminEmail, adminPassword, 'Administrador JC Resolve', 'ADMIN');
    console.log(`Administrador configurado: ${adminEmail}`);
  } else {
    console.warn('ADMIN_EMAIL/ADMIN_PASSWORD não definidos: nenhum administrador foi criado.');
  }

  for (const p of DEMO_PRODUCTS) {
    const data = { ...p, images: [p.image], isDemo: true };
    await prisma.product.upsert({ where: { id: p.id }, update: data, create: data });
  }

  // Agendamentos demonstrativos (identificados como simulação)
  const today = todayISO();
  const demos = [
    { id: 'demo-appt-1', date: addDays(today, 1), startMin: 14 * 60, endMin: 16 * 60, professional: 'ELETRICISTA', serviceArea: 'ELETRICA', serviceType: 'INTERMEDIARIO', price: 220, urgency: 'MEDIA', problemDescription: 'Tomada da cozinha sem energia (exemplo).' },
    { id: 'demo-appt-2', date: addDays(today, 1), startMin: 14 * 60, endMin: 16 * 60, professional: 'HIDRAULICA', serviceArea: 'HIDRAULICA', serviceType: 'INTERMEDIARIO', price: 220, urgency: 'ALTA', problemDescription: 'Vazamento embaixo da pia (exemplo).' },
    { id: 'demo-appt-3', date: addDays(today, 2), startMin: 9 * 60, endMin: 10 * 60, professional: 'REFRIGERACAO', serviceArea: 'REFRIGERACAO', serviceType: 'SIMPLES', price: 120, urgency: 'BAIXA', problemDescription: 'Ar-condicionado não gela (exemplo).' },
  ];
  for (const d of demos) {
    const data = { ...d, customerName: 'Cliente demonstrativo', customerPhone: '(61) 00000-0000', status: 'CONFIRMADO', isDemo: true, notes: 'Registro de simulação criado pelo seed.' };
    await prisma.appointment.upsert({ where: { id: d.id }, update: {}, create: data });
  }
  console.log('Seed concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
