/* SERVIÇOS — apresentação institucional (sem misturar com a Loja) */
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Info, Search, UserCog } from 'lucide-react';
import { RequestServiceButton } from '@/components/request-service-button';
import { AREA_TO_PROFESSIONAL, formatBRL, PROFESSIONALS, SERVICE_AREAS, SERVICE_TYPE_KEYS, SERVICE_TYPES, ServiceArea } from '@/lib/constants';

export const metadata = { title: 'Serviços | JC Resolve' };

export default function ServicosPage() {
  return (
    <>
      <section className="bg-navy py-14 text-white">
        <div className="container-jc">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Serviços de manutenção</h1>
          <p className="mt-2 max-w-2xl text-white/75">Escolha o serviço, descreva o problema e agende o melhor horário. Não sabe qual escolher? Use o assistente.</p>
          <Link href="/#assistente" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground hover:brightness-95">
            <Search className="h-4 w-4" /> Encontrar solução
          </Link>
        </div>
      </section>

      <section className="py-14">
        <div className="container-jc space-y-6">
          {(Object.keys(SERVICE_AREAS) as ServiceArea[]).map((key, i) => {
            const area = SERVICE_AREAS[key];
            return (
              <article id={key.toLowerCase()} key={key} className={`card-jc grid scroll-mt-24 overflow-hidden md:grid-cols-2 ${i % 2 ? 'bg-muted' : ''}`}>
                <div className={`relative aspect-[16/10] bg-muted md:aspect-auto md:min-h-[260px] ${i % 2 ? 'md:order-2' : ''}`}>
                  <Image src={area.image} alt={`Serviço de ${area.label}`} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
                </div>
                <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
                  <h2 className="font-display text-2xl font-extrabold">{area.label}</h2>
                  <p className="text-muted-foreground">{area.description}</p>
                  <p className="inline-flex items-center gap-2 text-sm font-medium">
                    <UserCog className="h-4 w-4 text-deep" /> Profissional: {PROFESSIONALS[AREA_TO_PROFESSIONAL[key]].label}
                  </p>
                  <div><RequestServiceButton area={key} label={area.label.toLowerCase()} /></div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-muted py-14">
        <div className="container-jc">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-extrabold">Tipos de agendamento</h2>
            <span className="badge-sim"><Info className="h-3 w-3" /> Valores de simulação</span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">O valor varia conforme a complexidade e o tempo do serviço. Os valores oficiais ainda serão definidos pela JC Resolve; os abaixo servem apenas para demonstração.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {SERVICE_TYPE_KEYS.map((t) => (
              <div key={t} className="card-jc p-6 hover:shadow-lg">
                <p className="font-display text-lg font-bold">{SERVICE_TYPES[t].label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{SERVICE_TYPES[t].description}</p>
                <p className="mt-4 font-display text-3xl font-extrabold">{formatBRL(SERVICE_TYPES[t].price)}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Bloqueia {SERVICE_TYPES[t].durationMin / 60}h na agenda do profissional (simulação)</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
