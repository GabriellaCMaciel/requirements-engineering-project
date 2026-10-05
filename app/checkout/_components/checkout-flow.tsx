'use client';

/* =====================================================================
 * FLUXO DE CHECKOUT EM ETAPAS
 * Carrinho → Revisão → Identificação → Pagamento → Endereço → Agendamento → Confirmação
 * - A etapa "Agendamento" só aparece se houver serviço no carrinho.
 * - O conflito de horário é conferido no navegador (para avisar cedo) e
 *   DE NOVO no servidor no momento de gravar (garantia definitiva).
 * ===================================================================== */
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, CalendarClock, CheckCircle2, ClipboardList, CreditCard, ExternalLink, Loader2, MapPin, Pencil, ShoppingCart, UserCheck, Wrench,
} from 'lucide-react';
import { useCart } from '@/components/cart-provider';
import { OrderSummary } from '@/components/order-summary';
import { ServiceTypePicker } from '@/components/service-type-picker';
import { checkSlotConflict, SlotPicker } from '@/components/slot-picker';
import { LoginForm, SignupForm } from '@/components/auth-forms';
import {
  AREA_TO_PROFESSIONAL, CONFLICT_MESSAGE, formatBRL, PAGBANK_LINK, PROFESSIONALS, SERVICE_AREAS, SERVICE_TYPES, URGENCIES, URGENCY_KEYS, Urgency,
} from '@/lib/constants';
import { formatDateBR, minToTime } from '@/lib/scheduling';
import { AddressForm, addressIsValid, CheckoutAddress, EMPTY_ADDRESS } from './address-form';

type StepKey = 'revisao' | 'identificacao' | 'pagamento' | 'endereco' | 'agendamento' | 'confirmacao';
const STEP_META: Record<StepKey, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  revisao: { label: 'Revisão', icon: ClipboardList },
  identificacao: { label: 'Identificação', icon: UserCheck },
  pagamento: { label: 'Pagamento', icon: CreditCard },
  endereco: { label: 'Endereço', icon: MapPin },
  agendamento: { label: 'Agendamento', icon: CalendarClock },
  confirmacao: { label: 'Confirmação', icon: CheckCircle2 },
};

export function CheckoutFlow() {
  const router = useRouter();
  const { data: session, status: sessionStatus, update } = useSession();
  const cart = useCart();
  const { ready, products, service, totals, updateService, clear } = cart;

  const [step, setStep] = useState<StepKey>('revisao');
  const [authMode, setAuthMode] = useState<'login' | 'cadastro'>('login');
  const [paymentAck, setPaymentAck] = useState(false);
  const [address, setAddress] = useState<CheckoutAddress>(EMPTY_ADDRESS);
  const [urgency, setUrgency] = useState<Urgency>('MEDIA');
  const [slot, setSlot] = useState<{ date: string; startMin: number | null }>({ date: '', startMin: null });
  const [scheduleError, setScheduleError] = useState('');
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [profile, setProfile] = useState<{ name?: string | null; email?: string | null; phone?: string | null; cep?: string | null } | null>(null);

  const loggedIn = sessionStatus === 'authenticated' && !!session?.user?.id;
  const steps = useMemo<StepKey[]>(
    () => ['revisao', 'identificacao', 'pagamento', 'endereco', ...(service ? (['agendamento'] as StepKey[]) : []), 'confirmacao'],
    [service],
  );
  const stepIndex = Math.max(0, steps.indexOf(step));
  const professional = service ? AREA_TO_PROFESSIONAL[service.area] : null;
  const serviceType = service ? SERVICE_TYPES[service.serviceType] : null;

  // Carrega os dados do cliente logado e pré-preenche o CEP do cadastro
  useEffect(() => {
    if (!loggedIn) { setProfile(null); return; }
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setProfile(data ?? null);
        if (data?.cep) setAddress((a) => (a.cep ? a : { ...a, cep: String(data.cep).replace(/^(\d{5})(\d{3})$/, '$1-$2') }));
      })
      .catch((err) => console.error(err));
  }, [loggedIn]);

  const go = (k: StepKey) => { setStep(k); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const next = () => go(steps[Math.min(steps.length - 1, stepIndex + 1)] ?? 'confirmacao');
  const back = () => go(steps[Math.max(0, stepIndex - 1)] ?? 'revisao');

  /* ---------- Estados de carregamento / carrinho vazio ---------- */
  if (!ready || submitted) {
    return <div className="mt-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Carregando" /></div>;
  }
  if ((products?.length ?? 0) === 0 && !service) {
    return (
      <div className="card-jc mt-6 flex flex-col items-center gap-4 p-10 text-center">
        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">Seu carrinho está vazio.</p>
        <Link href="/loja" className="rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground">Ir para a Loja</Link>
      </div>
    );
  }

  /* ---------- Validação do agendamento antes de avançar ---------- */
  const confirmSchedule = async () => {
    if (!service || !professional || !serviceType) return next();
    setScheduleError('');
    if (!slot.date || slot.startMin === null) { setScheduleError('Escolha a data e o horário do atendimento.'); return; }
    setChecking(true);
    try {
      const conflict = await checkSlotConflict(professional, slot.date, slot.startMin, serviceType.durationMin);
      if (conflict) { setScheduleError(CONFLICT_MESSAGE); setSlot((s) => ({ ...s, startMin: null })); return; }
      next();
    } catch (err) {
      console.error(err);
      setScheduleError('Não foi possível consultar a agenda. Tente novamente.');
    } finally {
      setChecking(false);
    }
  };

  /* ---------- Gravação do pedido ---------- */
  const submitOrder = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: (products ?? []).map((p) => ({ productId: p.productId, quantity: p.quantity })),
          service: service ? { area: service.area, serviceType: service.serviceType, urgency, date: slot.date, startMin: slot.startMin, problemDescription: service.problemDescription } : null,
          address,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 || data?.conflict) {
        // Alguém reservou o horário enquanto o cliente finalizava
        setScheduleError(data?.error ?? CONFLICT_MESSAGE);
        setSlot((s) => ({ ...s, startMin: null }));
        toast.error(data?.error ?? CONFLICT_MESSAGE);
        go('agendamento');
        return;
      }
      if (!res.ok || !data?.id) throw new Error(data?.error ?? 'Não foi possível registrar o pedido.');
      setSubmitted(true);
      clear();
      toast.success(`Pedido ${data?.code ?? ''} registrado!`);
      router.push(`/pedido/${data.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao registrar o pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  const descriptionOk = !service || (service.problemDescription ?? '').trim().length >= 3;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      {/* min-w-0 evita que o conteúdo force a coluna a crescer e gere rolagem horizontal */}
      <div className="min-w-0 space-y-5">
        {/* Indicador de etapas */}
        <ol className="card-jc flex gap-1 overflow-x-auto p-3 scrollbar-none" aria-label="Etapas do checkout">
          {steps.map((k, i) => {
            const Icon = STEP_META[k].icon;
            const done = i < stepIndex;
            const current = i === stepIndex;
            return (
              <li key={k} className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => done && go(k)}
                  disabled={!done}
                  aria-current={current ? 'step' : undefined}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold sm:text-sm ${current ? 'bg-secondary text-secondary-foreground' : done ? 'text-deep hover:bg-accent' : 'text-muted-foreground'}`}
                >
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${current ? 'bg-primary text-primary-foreground' : done ? 'bg-success text-white' : 'bg-muted'}`}>
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <Icon className="hidden h-4 w-4 sm:block" /> {STEP_META[k].label}
                </button>
                {i < steps.length - 1 && <span className="mx-0.5 h-px w-3 bg-border" aria-hidden />}
              </li>
            );
          })}
        </ol>

        <section className="card-jc p-5 sm:p-6" aria-labelledby="step-title">
          <h2 id="step-title" className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
            {(() => { const Icon = STEP_META[step].icon; return <Icon className="h-5 w-5 text-deep" />; })()}
            {STEP_META[step].label}
          </h2>

          {/* 1. REVISÃO */}
          {step === 'revisao' && (
            <div className="space-y-4">
              <CartContents />
              {!descriptionOk && <p role="alert" className="text-sm text-destructive">Descreva o problema no carrinho antes de continuar.</p>}
              <div className="flex flex-wrap justify-between gap-3">
                <Link href="/carrinho" className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold hover:bg-accent"><Pencil className="h-4 w-4" /> Editar carrinho</Link>
                <NextBtn onClick={next} disabled={!descriptionOk} />
              </div>
            </div>
          )}

          {/* 2. IDENTIFICAÇÃO */}
          {step === 'identificacao' && (
            loggedIn ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4 text-sm">
                  <p className="font-semibold">Você está identificado como:</p>
                  <p className="mt-1">{profile?.name ?? session?.user?.name ?? '—'}</p>
                  <p className="text-muted-foreground">{profile?.email ?? session?.user?.email ?? ''}{profile?.phone ? ` • ${profile.phone}` : ''}</p>
                </div>
                <Nav onBack={back} onNext={next} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex rounded-lg bg-muted p-1" role="tablist" aria-label="Entrar ou criar conta">
                  {(['login', 'cadastro'] as const).map((m) => (
                    <button key={m} type="button" role="tab" aria-selected={authMode === m} onClick={() => setAuthMode(m)} className={`flex-1 rounded-md py-2 text-sm font-semibold ${authMode === m ? 'bg-card shadow' : 'text-muted-foreground'}`}>
                      {m === 'login' ? 'Já tenho conta' : 'Criar conta'}
                    </button>
                  ))}
                </div>
                {authMode === 'login'
                  ? <LoginForm onSuccess={async () => { await update(); toast.success('Login realizado.'); go('pagamento'); }} />
                  : <SignupForm onSuccess={async () => { await update(); toast.success('Conta criada!'); go('pagamento'); }} />}
                <button type="button" onClick={back} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</button>
              </div>
            )
          )}

          {/* 3. PAGAMENTO (link PagBank — sem coleta de cartão) */}
          {step === 'pagamento' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                O pagamento é feito diretamente no ambiente do PagBank. <strong className="text-foreground">Este site não coleta nem armazena dados de cartão.</strong>
              </p>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm">Valor total do pedido</p>
                <p className="font-display text-2xl font-extrabold">{formatBRL(totals.total)}</p>
              </div>
              <a href={PAGBANK_LINK} target="_blank" rel="noopener noreferrer" onClick={() => setPaymentAck(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 font-bold text-primary-foreground shadow-sm hover:brightness-95 sm:w-auto">
                <CreditCard className="h-5 w-5" /> Pagar com PagBank <ExternalLink className="h-4 w-4" />
              </a>
              <p className="badge-sim">Link demonstrativo</p>
              <p className="text-xs text-muted-foreground">
                O link oficial de pagamento será definido pela JC Resolve. O pedido fica com status “Aguardando pagamento” até a equipe confirmar o recebimento.
              </p>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={paymentAck} onChange={(e) => setPaymentAck(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[hsl(var(--deep))]" />
                Entendi como funciona o pagamento e quero continuar (simulação).
              </label>
              <Nav onBack={back} onNext={next} disabled={!paymentAck} />
            </div>
          )}

          {/* 4. ENDEREÇO */}
          {step === 'endereco' && (
            <div className="space-y-5">
              <AddressForm value={address} onChange={(patch) => setAddress((a) => ({ ...a, ...patch }))} />
              {!addressIsValid(address) && <p className="text-xs text-muted-foreground">Preencha os campos marcados com * para continuar.</p>}
              <Nav onBack={back} onNext={next} disabled={!addressIsValid(address)} />
            </div>
          )}

          {/* 5. AGENDAMENTO */}
          {step === 'agendamento' && service && professional && serviceType && (
            <div className="space-y-5">
              <div className="rounded-lg bg-muted p-4 text-sm">
                <p><span className="font-semibold">Serviço:</span> {SERVICE_AREAS[service.area]?.label}</p>
                <p><span className="font-semibold">Profissional:</span> {PROFESSIONALS[professional]?.label}</p>
                <p className="mt-1 text-muted-foreground">“{service.problemDescription}”</p>
              </div>
              <div>
                <p className="field-label">Tipo de agendamento <span className="badge-sim ml-1">valores de simulação</span></p>
                <ServiceTypePicker value={service.serviceType} onChange={(t) => { updateService({ serviceType: t }); setSlot((s) => ({ ...s, startMin: null })); }} />
              </div>
              <div>
                <p className="field-label">Urgência</p>
                <div role="radiogroup" aria-label="Urgência" className="flex gap-2">
                  {URGENCY_KEYS.map((u) => (
                    <button key={u} type="button" role="radio" aria-checked={urgency === u} onClick={() => setUrgency(u)} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${urgency === u ? 'bg-secondary text-secondary-foreground shadow' : 'bg-muted hover:bg-accent'}`}>
                      {URGENCIES[u].label}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">A urgência ajuda a equipe a organizar a agenda. Não representa prazo garantido de atendimento.</p>
              </div>
              <SlotPicker professional={professional} durationMin={serviceType.durationMin} date={slot.date} startMin={slot.startMin} onChange={(v) => { setSlot(v); setScheduleError(''); }} />
              {scheduleError && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive">{scheduleError}</p>}
              <Nav onBack={back} onNext={confirmSchedule} loading={checking} />
            </div>
          )}

          {/* 6. REVISÃO FINAL / CONFIRMAÇÃO */}
          {step === 'confirmacao' && (
            <div className="space-y-4">
              <ReviewBlock title="Itens do pedido" onEdit={() => go('revisao')}><CartContents compact /></ReviewBlock>
              <ReviewBlock title="Identificação" onEdit={loggedIn ? undefined : () => go('identificacao')}>
                <p>{profile?.name ?? session?.user?.name ?? '—'}</p>
                <p className="text-muted-foreground">{profile?.email ?? session?.user?.email ?? ''}{profile?.phone ? ` • ${profile.phone}` : ''}</p>
              </ReviewBlock>
              <ReviewBlock title="Pagamento" onEdit={() => go('pagamento')}><p>Link PagBank (demonstrativo) — status inicial: Aguardando pagamento</p></ReviewBlock>
              <ReviewBlock title="Endereço" onEdit={() => go('endereco')}>
                <p>{address.street}, {address.number}{address.complement ? ` - ${address.complement}` : ''}</p>
                <p className="text-muted-foreground">{address.district} • {address.city}/{address.uf} • CEP {address.cep}{address.reference ? ` • Ref.: ${address.reference}` : ''}</p>
              </ReviewBlock>
              {service && serviceType && professional && slot.startMin !== null && (
                <ReviewBlock title="Agendamento" onEdit={() => go('agendamento')}>
                  <p>{SERVICE_AREAS[service.area]?.label} • {serviceType.label} • Profissional: {PROFESSIONALS[professional]?.label}</p>
                  <p className="text-muted-foreground">{formatDateBR(slot.date)}, {minToTime(slot.startMin)} às {minToTime(slot.startMin + serviceType.durationMin)} • Urgência {URGENCIES[urgency].label}</p>
                </ReviewBlock>
              )}
              {submitError && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{submitError}</p>}
              <div className="flex flex-wrap justify-between gap-3">
                <button type="button" onClick={back} className="inline-flex items-center gap-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold hover:bg-accent"><ArrowLeft className="h-4 w-4" /> Voltar</button>
                <button type="button" onClick={submitOrder} disabled={submitting || !loggedIn} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground shadow-sm hover:brightness-95 disabled:opacity-60">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Confirmar pedido
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Resumo lateral sempre visível */}
      <aside className="card-jc p-5 lg:sticky lg:top-24" aria-label="Resumo do pedido">
        <h2 className="mb-3 font-display text-lg font-bold">Resumo</h2>
        <OrderSummary totals={totals} hasProducts={(products?.length ?? 0) > 0} hasService={!!service} />
      </aside>
    </div>
  );
}

/* ---------- Pequenos componentes de apoio ---------- */

function CartContents({ compact = false }: { compact?: boolean }) {
  const { products, service } = useCart();
  return (
    <ul className="divide-y text-sm">
      {service && (
        <li className="flex items-start gap-3 py-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-secondary text-primary"><Wrench className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Serviço: {SERVICE_AREAS[service.area]?.label} — {SERVICE_TYPES[service.serviceType]?.label}</p>
            {!compact && <p className="line-clamp-2 text-muted-foreground">“{service.problemDescription}”</p>}
          </div>
          <span className="font-semibold">{formatBRL(SERVICE_TYPES[service.serviceType]?.price)}</span>
        </li>
      )}
      {(products ?? []).map((p) => (
        <li key={p.productId} className="flex items-center gap-3 py-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
            {p.image ? <Image src={p.image} alt={p.name} fill sizes="48px" className="object-cover" /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{p.name}</p>
            <p className="text-muted-foreground">{p.quantity} × {formatBRL(p.price)}</p>
          </div>
          <span className="font-semibold">{formatBRL(p.price * p.quantity)}</span>
        </li>
      ))}
    </ul>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit?: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted p-4 text-sm">
      <div className="mb-1 flex items-center justify-between">
        <p className="font-bold">{title}</p>
        {onEdit && <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-xs font-semibold text-deep hover:underline"><Pencil className="h-3.5 w-3.5" /> Editar</button>}
      </div>
      {children}
    </div>
  );
}

function NextBtn({ onClick, disabled, loading }: { onClick: () => void; disabled?: boolean; loading?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled || loading} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-bold text-primary-foreground shadow-sm hover:brightness-95 disabled:opacity-50">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Continuar <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function Nav({ onBack, onNext, disabled, loading }: { onBack: () => void; onNext: () => void; disabled?: boolean; loading?: boolean }) {
  return (
    <div className="flex flex-wrap justify-between gap-3 pt-1">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold hover:bg-accent"><ArrowLeft className="h-4 w-4" /> Voltar</button>
      <NextBtn onClick={onNext} disabled={disabled} loading={loading} />
    </div>
  );
}
