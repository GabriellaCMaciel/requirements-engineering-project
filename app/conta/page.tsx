/* =====================================================================
 * MINHA CONTA — área logada do cliente
 * Mostra SOMENTE os dados, pedidos e agendamentos do próprio cliente
 * (filtro por userId vindo da sessão, nunca da URL).
 * ===================================================================== */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Mail, MapPin, Package, Phone, User } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { formatBRL, ORDER_STATUS } from '@/lib/constants';
import { AccountAppointments, LogoutButton } from './_components/account-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Minha conta | JC Resolve' };

export default async function ContaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=/conta');

  const [user, orders, appointments] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true, phone: true, cep: true, role: true } }),
    prisma.order.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' }, include: { items: true, appointment: { select: { id: true } } }, take: 50 }),
    prisma.appointment.findMany({ where: { userId: session.user.id }, orderBy: [{ date: 'desc' }, { startMin: 'desc' }], take: 50 }),
  ]);
  if (!user) redirect('/login');

  const appts = appointments.map((a) => ({
    id: a.id, serviceArea: a.serviceArea, professional: a.professional, serviceType: a.serviceType, problemDescription: a.problemDescription,
    urgency: a.urgency, date: a.date, startMin: a.startMin, endMin: a.endMin, status: a.status, price: a.price,
  }));

  return (
    <div className="bg-muted py-10">
      <div className="container-jc">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold">Minha conta</h1>
            <p className="mt-1 text-muted-foreground">Seus dados, pedidos e agendamentos em um só lugar.</p>
          </div>
          <div className="flex gap-2">
            {user.role === 'ADMIN' && (
              <Link href="/admin" className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground"><LayoutDashboard className="h-4 w-4" /> Painel admin</Link>
            )}
            <LogoutButton />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
          <section className="card-jc p-5 text-sm" aria-labelledby="dados">
            <h2 id="dados" className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><User className="h-5 w-5 text-deep" /> Meus dados</h2>
            <p className="font-semibold">{user.name ?? '—'}</p>
            <p className="mt-2 flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {user.email}</p>
            <p className="mt-1 flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {user.phone ?? '—'}</p>
            <p className="mt-1 flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> CEP {user.cep ?? '—'}</p>
          </section>

          <div className="space-y-6">
            <AccountAppointments appointments={appts} />

            <section className="card-jc p-5" aria-labelledby="pedidos">
              <h2 id="pedidos" className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><Package className="h-5 w-5 text-deep" /> Meus pedidos</h2>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Você ainda não fez pedidos. <Link href="/loja" className="font-semibold text-deep hover:underline">Conheça a Loja</Link>.</p>
              ) : (
                <ul className="space-y-2">
                  {orders.map((o) => (
                    <li key={o.id}>
                      <Link href={`/pedido/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted p-3 text-sm transition hover:bg-accent">
                        <span>
                          <span className="font-bold">{o.code}</span>
                          <span className="ml-2 text-muted-foreground">
                            {o.items.length > 0 ? `${o.items.reduce((s, i) => s + i.quantity, 0)} produto(s)` : ''}
                            {o.items.length > 0 && o.appointment ? ' + ' : ''}
                            {o.appointment ? 'serviço' : ''}
                          </span>
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold">{ORDER_STATUS[o.status] ?? o.status}</span>
                          <span className="font-semibold">{formatBRL(o.total)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
