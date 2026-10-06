/* Logotipo da JC Resolve: símbolo "JC" (public/logo-mark.png, enviado pelo cliente) + nome em texto.
 * O nome fica em texto (e não na imagem) para continuar nítido em qualquer tamanho e no modo claro/escuro. */
import Image from 'next/image';
import Link from 'next/link';

export function Logo({ light = true }: { light?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="JC Resolve — página inicial">
      <Image src="/logo-mark.png" alt="" width={420} height={271} priority className="h-9 w-auto transition-transform group-hover:-rotate-3" />
      <span className={`font-display text-lg uppercase leading-none tracking-wide ${light ? 'text-white' : 'text-foreground'}`}>
        <span className="font-extrabold">JC</span> <span className="font-light">Resolve</span>
      </span>
    </Link>
  );
}
