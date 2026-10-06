'use client';

/* Logotipo da JC Resolve: símbolo "JC" (public/logo-mark.png, enviado pelo cliente) + nome em texto.
 * Clique: na Home, rola suavemente ao topo; em outra página, vai para a Home (comportamento normal do link). */
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Logo({ light = true }: { light?: boolean }) {
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== '/') return; // em outra página: o Link leva para a Home
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // limpa âncoras como #contato da barra de endereço
    if (window.location.hash) window.history.replaceState(null, '', '/');
  };

  return (
    <Link href="/" onClick={handleClick} className="group inline-flex items-center gap-2.5" aria-label="JC Resolve — página inicial">
      <Image src="/logo-mark.png" alt="" width={420} height={271} priority className="h-9 w-auto transition-transform group-hover:-rotate-3" />
      <span className={`font-display text-lg uppercase leading-none tracking-wide ${light ? 'text-white' : 'text-foreground'}`}>
        <span className="font-extrabold">JC</span> <span className="font-light">Resolve</span>
      </span>
    </Link>
  );
}
