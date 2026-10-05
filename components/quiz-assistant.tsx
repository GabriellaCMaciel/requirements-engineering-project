'use client';

/* =====================================================================
 * QUIZ / ASSISTENTE DE SERVIÇO (interface)
 * 1. Cliente descreve o problema em texto livre;
 * 2. classifyProblem() identifica serviço + profissional por palavras-chave;
 * 3. suggestProducts() sugere itens da Loja — o cliente escolhe se quer;
 * 4. "Agendar este serviço" coloca o serviço no carrinho e segue o fluxo.
 * ===================================================================== */
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Plus, Search, Sparkles, UserCog, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from './cart-provider';
import { classifyProblem, QuizResult, suggestProducts } from '@/lib/quiz';
import { AREA_TO_PROFESSIONAL, formatBRL, PROFESSIONALS, SERVICE_AREAS, ServiceArea } from '@/lib/constants';
import type { ProductDTO } from '@/lib/products';

const EXAMPLES = ['Preciso trocar a lâmpada da sala.', 'A torneira da cozinha está vazando.', 'O ar-condicionado não gela.', 'Quero instalar uma prateleira.'];

export function QuizAssistant({ products }: { products: ProductDTO[] }) {
  const router = useRouter();
  const { addProduct, removeProduct, products: cartProducts, service, setService } = useCart();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<QuizResult | null>(null);

  const suggestions = useMemo(() => (result ? suggestProducts(products ?? [], result) : []), [products, result]);
  const inCart = (id: string) => (cartProducts ?? []).some((p) => p.productId === id);

  const analyze = () => {
    if (text.trim().length < 4) {
      setError('Conte um pouco mais sobre o problema (ex.: "a tomada do quarto parou").');
      return;
    }
    setError('');
    setResult(classifyProblem(text.trim()));
  };

  /** Cliente pode corrigir manualmente o serviço identificado */
  const changeArea = (area: ServiceArea) => {
    if (!result) return;
    setResult({ ...result, area, professional: AREA_TO_PROFESSIONAL[area], matchedKeywords: [] });
  };

  const toggleProduct = (p: ProductDTO) => {
    if (inCart(p.id)) {
      removeProduct(p.id);
    } else {
      addProduct({ productId: p.id, name: p.name, price: p.price, image: p.image });
      toast.success(`${p.name} adicionado ao carrinho.`);
    }
  };

  const schedule = () => {
    if (!result) return;
    if (service) toast.info('O serviço anterior do carrinho foi substituído por este.');
    setService({ area: result.area, problemDescription: result.description, serviceType: service?.serviceType ?? 'SIMPLES' });
    router.push('/carrinho');
  };

  return (
    <div className="card-jc overflow-hidden">
      {!result ? (
        <div className="p-5 sm:p-8">
          <label htmlFor="quiz-text" className="flex items-center gap-2 font-display text-lg font-bold">
            <Sparkles className="h-5 w-5 text-deep" /> Descreva o que aconteceu
          </label>
          <p className="mt-1 text-sm text-muted-foreground">Escreva do seu jeito, sem termos técnicos. Nós identificamos o serviço.</p>
          <textarea
            id="quiz-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) analyze(); }}
            rows={4}
            maxLength={600}
            placeholder='Ex.: "Preciso trocar a lâmpada da sala."'
            className="mt-4 w-full resize-none rounded-lg border border-input bg-muted p-4 text-base focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            aria-describedby={error ? 'quiz-error' : undefined}
          />
          {error && <p id="quiz-error" role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => setText(ex)} className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition hover:bg-secondary hover:text-secondary-foreground">
                {ex}
              </button>
            ))}
          </div>
          <button type="button" onClick={analyze} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-sm transition hover:brightness-95 hover:shadow-md sm:w-auto">
            <Search className="h-5 w-5" /> Encontrar solução
          </button>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="grid gap-0 md:grid-cols-[260px_1fr]">
            <div className="relative aspect-video bg-muted md:aspect-auto">
              <Image src={SERVICE_AREAS[result.area].image} alt={`Serviço de ${SERVICE_AREAS[result.area].label}`} fill sizes="(max-width:768px) 100vw, 260px" className="object-cover" />
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
                  <Wrench className="h-4 w-4" /> {SERVICE_AREAS[result.area].label}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm font-semibold">
                  <UserCog className="h-4 w-4" /> Profissional: {PROFESSIONALS[result.professional].quizLabel}
                </span>
              </div>
              <blockquote className="rounded-lg bg-muted p-3 text-sm italic text-muted-foreground">“{result.description}”</blockquote>
              <p className="text-xs text-muted-foreground">
                {result.matchedKeywords.length > 0
                  ? <>Palavras identificadas: <strong className="text-foreground">{result.matchedKeywords.join(', ')}</strong>.</>
                  : 'Nenhuma palavra-chave específica encontrada — sugerimos Reparos gerais.'}{' '}
                O profissional é uma sugestão; a JC Resolve confirma o direcionamento.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label htmlFor="quiz-area" className="text-sm font-medium">Não é isso?</label>
                <select id="quiz-area" value={result.area} onChange={(e) => changeArea(e.target.value as ServiceArea)} className="field h-10 sm:max-w-xs">
                  {(Object.keys(SERVICE_AREAS) as ServiceArea[]).map((a) => <option key={a} value={a}>{SERVICE_AREAS[a].label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="bg-muted p-5 sm:p-6">
              <h3 className="font-display text-base font-bold">Produtos que podem ajudar</h3>
              <p className="text-xs text-muted-foreground">Opcional — adicione somente o que quiser. Produtos + serviço no mesmo pedido têm 10% de desconto.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {suggestions.map((p) => {
                  const added = inCart(p.id);
                  return (
                    <div key={p.id} className="flex min-w-0 items-center gap-3 rounded-lg bg-card p-2.5 shadow-sm">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image src={p.image} alt={p.name} fill sizes="56px" className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{p.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{formatBRL(p.price)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleProduct(p)}
                        aria-pressed={added}
                        className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition ${added ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground hover:brightness-95'}`}
                      >
                        {added ? <><Check className="h-3.5 w-3.5" /> Adicionado</> : <><Plus className="h-3.5 w-3.5" /> Adicionar</>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 p-5 sm:flex-row sm:justify-between sm:p-6">
            <button type="button" onClick={() => setResult(null)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold hover:bg-border">
              <ArrowLeft className="h-4 w-4" /> Corrigir descrição
            </button>
            <button type="button" onClick={schedule} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground shadow-sm hover:brightness-95 hover:shadow-md">
              Agendar este serviço <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
