import Link from 'next/link';
import { Home, SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="bg-muted py-20">
      <div className="container-jc flex flex-col items-center text-center">
        <SearchX className="h-14 w-14 text-muted-foreground" />
        <h1 className="mt-4 font-display text-3xl font-extrabold">Página não encontrada</h1>
        <p className="mt-2 text-muted-foreground">O endereço acessado não existe ou você não tem acesso a ele.</p>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground"><Home className="h-4 w-4" /> Voltar ao início</Link>
      </div>
    </div>
  );
}
