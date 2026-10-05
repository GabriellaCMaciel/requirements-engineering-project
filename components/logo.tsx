/* LOGOTIPO PROVISÓRIO — a JC Resolve ainda não enviou o logo oficial.
 * Para trocar: substitua o conteúdo deste componente por <Image src="/logo.svg" ... />. */
import Link from 'next/link';

export function Logo({ light = true }: { light?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2" aria-label="JC Resolve — página inicial">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-display text-base font-extrabold text-primary-foreground shadow-sm transition-transform group-hover:-rotate-3">
        JC
      </span>
      <span className={`font-display text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-foreground'}`}>
        Resolve
      </span>
    </Link>
  );
}
