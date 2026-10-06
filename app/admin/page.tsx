/* =====================================================================
 * PAINEL ADMINISTRATIVO (acesso exclusivo do perfil ADMIN)
 * O servidor busca os dados e entrega ao painel interativo. Depois de
 * cada alteração o painel chama router.refresh() para recarregar.
 * ===================================================================== */
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { formatAddress } from '@/lib/whatsapp';
import { AdminDashboard } from './_components/admin-dashboard';
import type { AdminAppointment, AdminOrder, AdminProduct } from './_components/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Painel administrativo | JC Resolve' };

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=/admin');
  if (session.user.role !== 'ADMIN') redirect('/conta');

  const [appointments, orders, products] = await Promise.all([
    prisma.appointment.findMany({
      orderBy: [{ date: 'asc' }, { startMin: 'asc' }],
      include: { order: { select: { code: true, items: { select: { name: true, quantity: true } } } } },
      take: 1000,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true, user: { select: { name: true, email: true, phone: true } }, appointment: { select: { id: true } } },
      take: 200,
    }),
    prisma.product.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const appts: AdminAppointment[] = appointments.map((a) => ({
    id: a.id, orderId: a.orderId, orderCode: a.order?.code ?? null,
    customerName: a.customerName, customerPhone: a.customerPhone, customerEmail: a.customerEmail,
    serviceArea: a.serviceArea, professional: a.professional, serviceType: a.serviceType, price: a.price,
    problemDescription: a.problemDescription, urgency: a.urgency, date: a.date, startMin: a.startMin, endMin: a.endMin,
    status: a.status, address: a.address, notes: a.notes, isDemo: a.isDemo,
    products: (a.order?.items ?? []).map((i) => `${i.quantity}× ${i.name}`),
  }));

  const ords: AdminOrder[] = orders.map((o) => ({
    id: o.id, code: o.code, status: o.status, createdAt: o.createdAt.toISOString(),
    customerName: o.user?.name ?? '', customerPhone: o.user?.phone ?? '', customerEmail: o.user?.email ?? '',
    items: (o.items ?? []).map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice })),
    productsSubtotal: o.productsSubtotal, serviceValue: o.serviceValue, discount: o.discount, total: o.total,
    address: formatAddress(o), appointmentId: o.appointment?.id ?? null,
  }));

  const prods: AdminProduct[] = products.map((p) => ({ id: p.id, name: p.name, description: p.description, price: p.price, category: p.category, serviceArea: p.serviceArea, available: p.available, image: p.image, tags: p.tags ?? [] }));

  return <AdminDashboard appointments={appts} orders={ords} products={prods} />;
}
