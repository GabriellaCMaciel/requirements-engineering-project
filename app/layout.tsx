import { DM_Sans, Manrope } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler';
import { Providers } from '@/components/providers';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { WhatsAppFloat } from '@/components/whatsapp-float';

export const dynamic = 'force-dynamic';

// DM Sans para textos e Manrope para títulos (identidade da JC Resolve)
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-display' });

export async function generateMetadata() {
  return {
    metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
    title: 'JC Resolve | Manutenção sem dor de cabeça',
    description: 'Manutenção residencial em Valparaíso de Goiás e região: elétrica, hidráulica, refrigeração, reparos gerais e instalações. Agende online.',
    icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
    openGraph: {
      title: 'JC Resolve | Manutenção sem dor de cabeça',
      description: 'Conte o que aconteceu, encontre a solução e agende o serviço.',
      images: ['/og-image.png'],
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
      </head>
      <body className={`${dmSans.variable} ${manrope.variable} font-sans`}>
        <Providers>
          <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
            Pular para o conteúdo
          </a>
          <SiteHeader />
          <main id="conteudo" className="min-h-[70vh]">{children}</main>
          <SiteFooter />
          <WhatsAppFloat />
        </Providers>
        <Toaster position="top-center" richColors theme="light" />
        {/* IMPORTANT: Do not remove — handles chunk loading race conditions in the dev server */}
        <ChunkLoadErrorHandler />
      </body>
    </html>
  );
}
