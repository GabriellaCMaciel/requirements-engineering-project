/* =====================================================================
 * PÁGINA DE CONFIRMAÇÃO / DETALHE DO PEDIDO
 * Apenas o DONO do pedido ou o administrador pode visualizar.
 * ===================================================================== */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CalendarClock, CheckCircle2, ClipboardList, MapPin, MessageCircle, Package, User, Wrench } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { APPOINTMENT_STATUS, formatBRL, ORDER_STATUS, PROFESSIONALS, SERVICE_AREAS, SERVICE_TYPES, URGENCIES } from '@/lib/constants';
import { formatDateBR, minToTime } from '@/lib/scheduling';
import { buildWhatsAppMessage, formatAddress, whatsappLink } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pedido | JC Resolve' };

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/pedido/${id}`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, appointment: true, user: { select: { name: true, email: true, phone: true } } },
  });
  // Pedido de outro cliente se comporta como "não encontrado" (não revela que existe)
  if (!order || (order.userId !== session.user.id && session.user.role !== 'ADMIN')) notFound();

  const address = formatAddress(order);
  const ap = order.appointment;
  const message = buildWhatsAppMessage({
    code: order.code,
    customerName: order.user?.name,
    customerPhone: order.user?.phone,
    customerEmail: order.user?.email,
    items: (order.items ?? []).map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice })),
    productsSubtotal: order.productsSubtotal,
    serviceValue: order.serviceValue,
    discount: order.discount,
    total: order.total,
    address,
    appointment: ap ? { ...ap } : null,
  });

  return (
    <div className="bg-muted py-10">
      <div className="container-jc max-w-3xl">
        <div className="card-jc p-6 text-center sm:p-8">
          <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
          <h1 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">Pedido registrado!</h1>
          <p className="mt-1 text-muted-foreground">Guarde o identificador do seu pedido:</p>
          <p className="mt-2 inline-block rounded-lg bg-secondary px-4 py-2 font-display text-xl font-extrabold tracking-wider text-primary">{order.code}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
            <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">Pedido: {ORDER_STATUS[order.status] ?? order.status}</span>
            {ap && <span className="rounded-full bg-accent px-3 py-1 font-semibold">Serviço: {APPOINTMENT_STATUS[ap.status] ?? ap.status}</span>}
          </div>
          <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground shadow-sm hover:brightness-95">
            <MessageCircle className="h-5 w-5" /> Enviar detalhes pelo WhatsApp
          </a>
          <p className="mt-2 text-xs text-muted-foreground">Abre o WhatsApp com todos os dados do pedido já preenchidos para a equipe da JC Resolve.</p>
        </div>

        <div className="mt-6 space-y-4">
          <Block icon={User} title="Cliente">
            <p>{order.user?.name ?? '—'}</p>
            <p className="text-muted-foreground">{order.user?.email}{order.user?.phone ? ` • ${order.user.phone}` : ''}</p>
          </Block>

          {ap && (
            <Block icon={CalendarClock} title="Agendamento">
              <p className="rounded-md bg-muted p-3 italic">“{ap.problemDescription}”</p>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                <Info label="Serviço" value={SERVICE_AREAS[ap.serviceArea as keyof typeof SERVICE_AREAS]?.label ?? ap.serviceArea} />
                <Info label="Profissional" value={PROFESSIONALS[ap.professional as keyof typeof PROFESSIONALS]?.label ?? ap.professional} />
                <Info label="Tipo" value={SERVICE_TYPES[ap.serviceType as keyof typeof SERVICE_TYPES]?.label ?? ap.serviceType} />
                <Info label="Urgência" value={URGENCIES[ap.urgency as keyof typeof URGENCIES]?.label ?? ap.urgency} />
                <Info label="Data" value={formatDateBR(ap.date)} />
                <Info label="Horário" value={`${minToTime(ap.startMin)} às ${minToTime(ap.endMin)}`} />
              </dl>
            </Block>
          )}

          {(order.items?.length ?? 0) > 0 && (
            <Block icon={Package} title="Produtos">
              <ul className="divide-y">
                {order.items.map((i) => (
                  <li key={i.id} className="flex justify-between py-2"><span>{i.quantity}× {i.name}</span><span className="font-semibold">{formatBRL(i.unitPrice * i.quantity)}</span></li>
                ))}
              </ul>
            </Block>
          )}

          <Block icon={MapPin} title="Endereço"><p>{address}</p></Block>

          <Block icon={ClipboardList} title="Valores">
            <dl className="space-y-1.5">
              <Row label="Produtos" value={formatBRL(order.productsSubtotal)} />
              <Row label="Serviço (valor de simulação)" value={formatBRL(order.serviceValue)} />
              <Row label="Desconto produtos + serviço" value={`− ${formatBRL(order.discount)}`} />
              <div className="flex justify-between border-t pt-2 text-base font-bold"><dt>Total</dt><dd>{formatBRL(order.total)}</dd></div>
            </dl>
          </Block>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/conta" className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-3 font-semibold text-secondary-foreground hover:brightness-110"><User className="h-4 w-4" /> Ver minha conta</Link>
          <Link href="/loja" className="inline-flex items-center gap-2 rounded-lg bg-card px-5 py-3 font-semibold shadow hover:shadow-md"><Wrench className="h-4 w-4" /> Continuar navegando</Link>
        </div>
      </div>
    </div>
  );
}

function Block({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <section className="card-jc p-5 text-sm">
      <h2 className="mb-2 flex items-center gap-2 font-display text-base font-bold"><Icon className="h-4 w-4 text-deep" /> {title}</h2>
      {children}
    </section>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd></div>;
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>;
}
