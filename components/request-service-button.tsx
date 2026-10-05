'use client';

import { useRouter } from 'next/navigation';
import { CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from './cart-provider';
import type { ServiceArea } from '@/lib/constants';

/** Coloca o serviço escolhido no carrinho e leva o cliente para descrever o problema */
export function RequestServiceButton({ area, label }: { area: ServiceArea; label: string }) {
  const router = useRouter();
  const { service, setService } = useCart();
  return (
    <button
      type="button"
      onClick={() => {
        if (service && service.area !== area) toast.info('O serviço anterior do carrinho foi substituído.');
        setService({ area, problemDescription: service?.area === area ? service.problemDescription : '', serviceType: service?.serviceType ?? 'SIMPLES' });
        router.push('/carrinho');
      }}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:brightness-95 hover:shadow-md"
    >
      <CalendarPlus className="h-4 w-4" /> Solicitar {label}
    </button>
  );
}
