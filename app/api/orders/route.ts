/* =====================================================================
 * CRIAÇÃO DO PEDIDO (produtos e/ou serviço agendado)
 * O servidor recalcula TODOS os valores e revalida o conflito de horário
 * dentro de uma transação antes de gravar qualquer coisa.
 * ===================================================================== */
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import {
  AREA_TO_PROFESSIONAL, CONFLICT_MESSAGE, SERVICE_AREAS, SERVICE_TYPES, ServiceArea, ServiceType, URGENCIES, Urgency,
  WORK_END_MIN, WORK_START_MIN,
} from '@/lib/constants';
import { computeTotals } from '@/lib/pricing';
import { nowMinutesBR, todayISO } from '@/lib/scheduling';
import { assertNoConflict, ConflictError, generateOrderCode } from '@/lib/scheduling-server';
import { formatAddress } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

const clean = (v: unknown, max = 200): string => String(v ?? '').trim().slice(0, max);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Faça login para concluir o pedido.' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 401 });

    /* ---------- 1. Produtos (preços sempre vindos do banco) ---------- */
    const rawItems: { productId: string; quantity: number }[] = Array.isArray(body?.items) ? body.items : [];
    const ids = rawItems.map((i) => String(i?.productId ?? ''));
    const dbProducts = ids.length ? await prisma.product.findMany({ where: { id: { in: ids }, available: true } }) : [];
    const items = rawItems
      .map((i) => {
        const p = dbProducts.find((d) => d.id === i?.productId);
        const quantity = Math.min(99, Math.max(1, Math.floor(Number(i?.quantity ?? 1))));
        return p ? { productId: p.id, name: p.name, unitPrice: p.price, quantity } : null;
      })
      .filter((i): i is { productId: string; name: string; unitPrice: number; quantity: number } => i !== null);
    if (items.length !== rawItems.length) {
      return NextResponse.json({ error: 'Algum produto do carrinho não está mais disponível. Revise o carrinho.' }, { status: 400 });
    }

    /* ---------- 2. Serviço (opcional) ---------- */
    const s = body?.service ?? null;
    let service: null | {
      area: ServiceArea; type: ServiceType; urgency: Urgency; date: string; startMin: number; endMin: number; description: string;
    } = null;
    if (s) {
      const area = s?.area as ServiceArea;
      const type = s?.serviceType as ServiceType;
      const urgency = s?.urgency as Urgency;
      const date = clean(s?.date, 10);
      const startMin = Math.floor(Number(s?.startMin));
      const description = clean(s?.problemDescription, 1000);
      if (!SERVICE_AREAS[area]) return NextResponse.json({ error: 'Serviço inválido.' }, { status: 400 });
      if (!SERVICE_TYPES[type]) return NextResponse.json({ error: 'Selecione o tipo de agendamento.' }, { status: 400 });
      if (!URGENCIES[urgency]) return NextResponse.json({ error: 'Selecione a urgência.' }, { status: 400 });
      if (description.length < 3) return NextResponse.json({ error: 'Descreva o problema.' }, { status: 400 });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < todayISO()) return NextResponse.json({ error: 'Escolha uma data a partir de hoje.' }, { status: 400 });
      const endMin = startMin + SERVICE_TYPES[type].durationMin;
      if (!Number.isFinite(startMin) || startMin < WORK_START_MIN || endMin > WORK_END_MIN) {
        return NextResponse.json({ error: 'Horário fora da janela demonstrativa.' }, { status: 400 });
      }
      if (date === todayISO() && startMin <= nowMinutesBR()) return NextResponse.json({ error: 'Esse horário já passou. Escolha outro.' }, { status: 400 });
      service = { area, type, urgency, date, startMin, endMin, description };
    }

    if (items.length === 0 && !service) return NextResponse.json({ error: 'O carrinho está vazio.' }, { status: 400 });

    /* ---------- 3. Endereço (pedido só nesta etapa do fluxo) ---------- */
    const a = body?.address ?? {};
    const address = {
      addressCep: clean(a?.cep, 9).replace(/\D/g, ''),
      addressStreet: clean(a?.street),
      addressNumber: clean(a?.number, 20),
      addressComplement: clean(a?.complement) || null,
      addressDistrict: clean(a?.district, 100),
      addressCity: clean(a?.city, 100),
      addressUf: clean(a?.uf, 2).toUpperCase(),
      addressReference: clean(a?.reference) || null,
    };
    if (address.addressCep.length !== 8 || !address.addressStreet || !address.addressNumber || !address.addressDistrict || !address.addressCity || address.addressUf.length !== 2) {
      return NextResponse.json({ error: 'Endereço incompleto.' }, { status: 400 });
    }

    /* ---------- 4. Valores + desconto (regra 10%) ---------- */
    const totals = computeTotals(
      items.map((i) => ({ price: i.unitPrice, quantity: i.quantity })),
      service ? SERVICE_TYPES[service.type].price : null,
    );

    /* ---------- 5. Gravação com validação de conflito ---------- */
    const order = await prisma.$transaction(async (tx) => {
      const professional = service ? AREA_TO_PROFESSIONAL[service.area] : null;
      if (service && professional) {
        await assertNoConflict(tx, { professional, date: service.date, startMin: service.startMin, endMin: service.endMin }, CONFLICT_MESSAGE);
      }
      const created = await tx.order.create({
        data: {
          code: generateOrderCode(),
          userId: user.id,
          productsSubtotal: totals.productsSubtotal,
          serviceValue: totals.serviceValue,
          discount: totals.discount,
          total: totals.total,
          problemDescription: service?.description ?? null,
          ...address,
          items: { create: items },
        },
      });
      if (service && professional) {
        await tx.appointment.create({
          data: {
            orderId: created.id,
            userId: user.id,
            customerName: user.name ?? '',
            customerPhone: user.phone ?? '',
            customerEmail: user.email,
            serviceArea: service.area,
            professional,
            serviceType: service.type,
            price: SERVICE_TYPES[service.type].price,
            problemDescription: service.description,
            urgency: service.urgency,
            date: service.date,
            startMin: service.startMin,
            endMin: service.endMin,
            address: formatAddress(address),
          },
        });
      }
      return created;
    });

    return NextResponse.json({ ok: true, id: order.id, code: order.code }, { status: 201 });
  } catch (err) {
    if (err instanceof ConflictError) return NextResponse.json({ error: err.message, conflict: true }, { status: 409 });
    console.error('Erro ao criar pedido:', err);
    return NextResponse.json({ error: 'Não foi possível registrar o pedido.' }, { status: 500 });
  }
}
