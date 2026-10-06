/* HOME — site institucional + assistente de serviço + acesso à Loja */
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CalendarCheck, Droplets, Hammer, Instagram, MessageCircle, Plug, Search, ShoppingBag, Snowflake, Wrench, Zap } from 'lucide-react';
import { QuizAssistant } from '@/components/quiz-assistant';
import { ProductCard } from '@/components/product-card';
import { getProducts } from '@/lib/products';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, SERVICE_AREAS, SERVICE_REGION, ServiceArea } from '@/lib/constants';
import { whatsappLink } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

const AREA_ICONS: Record<ServiceArea, React.ComponentType<{ className?: string }>> = {
  ELETRICA: Zap, HIDRAULICA: Droplets, REFRIGERACAO: Snowflake, REPAROS: Hammer, INSTALACOES: Plug,
};

const STEPS = [
  { icon: Search, title: 'Conte o problema', text: 'Descreva com suas palavras o que aconteceu.' },
  { icon: Wrench, title: 'Receba a indicação', text: 'Identificamos o serviço e o profissional adequado.' },
  { icon: CalendarCheck, title: 'Agende o horário', text: 'Escolha data, horário e urgência sem conflitos.' },
];

export default async function HomePage() {
  const products = await getProducts();
  const featured = products.filter((p) => p.available).slice(0, 4);

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-navy">
        <Image src="/images/hero.jpg" alt="Técnico realizando manutenção hidráulica em uma residência" fill priority sizes="100vw" className="-z-20 object-cover object-right" />
        <div className="hero-overlay absolute inset-0 -z-10" />
        <div className="container-jc py-20 sm:py-28 lg:py-32">
          <div className="max-w-2xl animate-fade-in">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
              <Wrench className="h-3.5 w-3.5 text-primary" /> Manutenção residencial • {SERVICE_REGION}
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              JC Resolve: Manutenção sem <span className="text-primary">dor de cabeça.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/80">Precisa de manutenção? Conte o que aconteceu.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#assistente" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-lg transition hover:brightness-95">
                <Search className="h-5 w-5" /> Encontrar solução
              </a>
              <Link href="/loja" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-6 py-3.5 font-semibold text-white backdrop-blur transition hover:bg-white/20">
                <ShoppingBag className="h-5 w-5" /> Ir para a Loja
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-deep">
        <div className="container-jc grid gap-4 py-8 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex items-start gap-3 text-white">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><s.icon className="h-5 w-5" /></span>
              <div>
                <p className="font-display font-bold">{i + 1}. {s.title}</p>
                <p className="text-sm text-white/70">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ASSISTENTE / QUIZ */}
      <section id="assistente" className="scroll-mt-16 bg-muted py-16">
        <div className="container-jc grid gap-8 lg:grid-cols-[minmax(0,1fr)_1.4fr] lg:items-start">
          <div>
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Precisa de manutenção? Conte o que aconteceu.</h2>
            <p className="mt-3 text-muted-foreground">Nosso assistente analisa a sua descrição, indica o tipo de serviço, o profissional adequado e sugere produtos relacionados. Você decide o que adicionar.</p>
            <ul className="mt-6 space-y-2 text-sm">
              <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-deep" /> Lâmpada, tomada, disjuntor → Eletricista</li>
              <li className="flex items-center gap-2"><Droplets className="h-4 w-4 text-deep" /> Torneira, vazamento, descarga → Hidráulico</li>
              <li className="flex items-center gap-2"><Snowflake className="h-4 w-4 text-deep" /> Ar-condicionado, não gela → Refrigeração</li>
              <li className="flex items-center gap-2"><Hammer className="h-4 w-4 text-deep" /> Outros problemas → Geral / Reparos gerais</li>
            </ul>
          </div>
          <QuizAssistant products={products} />
        </div>
      </section>

      {/* SERVIÇOS */}
      <section className="py-16">
        <div className="container-jc">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-3xl font-extrabold">Serviços</h2>
              <p className="mt-1 text-muted-foreground">Tudo o que sua casa precisa em um só lugar.</p>
            </div>
            <Link href="/servicos" className="inline-flex items-center gap-1 text-sm font-semibold text-deep hover:underline">Ver todos os serviços <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {(Object.keys(SERVICE_AREAS) as ServiceArea[]).map((key) => {
              const Icon = AREA_ICONS[key];
              const area = SERVICE_AREAS[key];
              return (
                <Link key={key} href={`/servicos#${key.toLowerCase()}`} className="card-jc group overflow-hidden hover:shadow-[0_10px_30px_-8px_rgba(8,26,48,0.25)]">
                  <div className="relative aspect-[4/3] bg-muted">
                    <Image src={area.image} alt={`Serviço de ${area.label}`} fill sizes="(max-width:768px) 50vw, 20vw" className="object-cover transition-transform duration-slow group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <p className="flex items-center gap-2 font-display font-bold"><Icon className="h-4 w-4 text-deep" /> {area.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{area.short}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* LOJA EM DESTAQUE */}
      <section className="bg-muted py-16">
        <div className="container-jc">
          <div className="overflow-hidden rounded-2xl bg-navy p-6 text-white shadow-lg sm:p-10">
            <div className="grid-pattern -m-6 p-6 sm:-m-10 sm:p-10">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ShoppingBag className="h-4 w-4" /> Loja JC Resolve</p>
                  <h2 className="mt-1 font-display text-3xl font-extrabold">Materiais para a sua manutenção</h2>
                  <p className="mt-2 max-w-lg text-white/70">Compre produtos e, se quiser, agende o serviço junto: produtos + serviço no mesmo pedido têm 10% de desconto.</p>
                </div>
                <Link href="/loja" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground hover:brightness-95">
                  Acessar a Loja <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">Produtos e preços demonstrativos para o protótipo.</p>
        </div>
      </section>

      {/* CTA WHATSAPP (destino do link "Contato" do menu) */}
      <section id="contato" className="scroll-mt-24 py-16">
        <div className="container-jc">
          <div className="flex flex-col items-center gap-5 rounded-2xl bg-deep px-6 py-12 text-center text-white shadow-lg">
            <MessageCircle className="h-10 w-10 text-primary" />
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Prefere conversar? Fale com a JC Resolve.</h2>
            <p className="max-w-lg text-white/70">Tire dúvidas ou peça um orçamento direto pelo WhatsApp.</p>
            <a href={whatsappLink('Olá, JC Resolve! Gostaria de um orçamento.')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-bold text-primary-foreground hover:brightness-95">
              <MessageCircle className="h-5 w-5" /> Chamar no WhatsApp
            </a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-primary">
              <Instagram className="h-4 w-4" /> Siga no Instagram {INSTAGRAM_HANDLE}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
