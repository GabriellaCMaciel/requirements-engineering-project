'use client';

/* Cabeçalho fixo com menu responsível (hambúrguer no celular) */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { LayoutDashboard, Menu, ShoppingCart, Store, User, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Logo } from './logo';
import { useCart } from './cart-provider';

// Itens do menu. Os que têm `icon` são exibidos apenas como ícone no desktop
// (ex.: Minha conta e Carrinho), mantém o texto no menu móvel por clareza.
type NavItem = { href: string; label: string; icon?: LucideIcon };
const NAV: NavItem[] = [
  { href: '/', label: 'Início' },
  { href: '/servicos', label: 'Serviços' },
  { href: '/loja', label: 'Loja / Produtos' },
  { href: '/#contato', label: 'Contato' },
  { href: '/conta', label: 'Minha conta', icon: User },
  { href: '/carrinho', label: 'Carrinho', icon: ShoppingCart },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession() ?? {};
  const { count, ready } = useCart();
  const isAdmin = session?.user?.role === 'ADMIN';

  // Fecha o menu móvel ao trocar de página
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : !href.includes('#') && pathname?.startsWith(href));

  return (
    <header className="sticky top-0 z-50 bg-navy/95 shadow-md backdrop-blur supports-[backdrop-filter]:bg-navy/85">
      <div className="container-jc flex h-16 items-center justify-between gap-3">
        <Logo />

        {/* Menu desktop */}
        <nav aria-label="Menu principal" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = isActive(item.href);
            // Itens com ícone (Minha conta / Carrinho) viram botões compactos com ícone.
            if (item.icon) {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  title={item.label}
                  className={`relative grid h-10 w-10 place-items-center rounded-md transition-colors ${active ? 'text-primary' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                >
                  <Icon className="h-5 w-5" />
                  {item.href === '/carrinho' && ready && count > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{count}</span>
                  )}
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? 'text-primary' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
              >
                {item.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link href="/admin" className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20">
              <LayoutDashboard className="h-4 w-4" /> Painel
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/loja" className="hidden items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20 sm:inline-flex lg:hidden">
            <Store className="h-4 w-4" /> Loja
          </Link>
          <Link href="/carrinho" aria-label={`Carrinho com ${ready ? count : 0} itens`} className="relative grid h-10 w-10 place-items-center rounded-lg text-white hover:bg-white/10 lg:hidden">
            <ShoppingCart className="h-5 w-5" />
            {ready && count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{count}</span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-movel"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            className="grid h-10 w-10 place-items-center rounded-lg text-white hover:bg-white/10 lg:hidden"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Menu móvel (hambúrguer) */}
      <nav id="menu-movel" aria-label="Menu móvel" className={`overflow-hidden border-t border-white/10 transition-[max-height] duration-slow lg:hidden ${open ? 'max-h-[520px]' : 'max-h-0'}`}>
        <div className="container-jc flex flex-col gap-1 py-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-3 text-base font-medium ${isActive(item.href) ? 'bg-white/10 text-primary' : 'text-white/90 hover:bg-white/10'}`}
            >
              {item.label}
              {item.href === '/carrinho' && ready && count > 0 && <span className="rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">{count}</span>}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium text-white/90 hover:bg-white/10">
              <LayoutDashboard className="h-5 w-5" /> Painel administrativo
            </Link>
          )}
          {!session?.user && (
            <Link href="/login" className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-3 font-semibold text-white">
              <User className="h-5 w-5" /> Entrar
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
