'use client';

/* Etapa "Endereço" do checkout.
 * O endereço completo só é pedido AQUI (não no cadastro), conforme o briefing.
 * A busca de CEP usa o serviço público e gratuito ViaCEP — se falhar, o
 * cliente simplesmente preenche os campos manualmente. */
import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { maskCep } from '@/components/auth-forms';

export interface CheckoutAddress {
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  uf: string;
  reference: string;
}

export const EMPTY_ADDRESS: CheckoutAddress = { cep: '', street: '', number: '', complement: '', district: '', city: '', uf: '', reference: '' };

/** Campos obrigatórios preenchidos? */
export function addressIsValid(a: CheckoutAddress): boolean {
  return (a?.cep ?? '').replace(/\D/g, '').length === 8 && !!a?.street?.trim() && !!a?.number?.trim() && !!a?.district?.trim() && !!a?.city?.trim() && (a?.uf ?? '').trim().length === 2;
}

export function AddressForm({ value, onChange }: { value: CheckoutAddress; onChange: (patch: Partial<CheckoutAddress>) => void }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const lookup = async () => {
    const digits = (value?.cep ?? '').replace(/\D/g, '');
    if (digits.length !== 8) { setMsg('Informe um CEP com 8 dígitos.'); return; }
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.erro) throw new Error('CEP não encontrado. Preencha o endereço manualmente.');
      onChange({ street: data?.logradouro ?? '', district: data?.bairro ?? '', city: data?.localidade ?? '', uf: data?.uf ?? '' });
    } catch (err) {
      console.error(err);
      setMsg(err instanceof Error ? err.message : 'Não foi possível buscar o CEP. Preencha manualmente.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof CheckoutAddress, label: string, opts: { required?: boolean; placeholder?: string; autoComplete?: string; className?: string; maxLength?: number } = {}) => (
    <div className={opts.className}>
      <label htmlFor={`end-${key}`} className="field-label">{label}{opts.required ? ' *' : ' (opcional)'}</label>
      <input
        id={`end-${key}`}
        value={value?.[key] ?? ''}
        onChange={(e) => onChange({ [key]: key === 'uf' ? e.target.value.toUpperCase().slice(0, 2) : e.target.value } as Partial<CheckoutAddress>)}
        placeholder={opts.placeholder}
        autoComplete={opts.autoComplete}
        maxLength={opts.maxLength}
        required={opts.required}
        className="field"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="end-cep" className="field-label">CEP *</label>
        <div className="flex gap-2">
          <input
            id="end-cep"
            value={value?.cep ?? ''}
            onChange={(e) => onChange({ cep: maskCep(e.target.value) })}
            onBlur={() => { if ((value?.cep ?? '').replace(/\D/g, '').length === 8 && !value?.street) lookup(); }}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="72870-000"
            className="field max-w-[180px]"
          />
          <button type="button" onClick={lookup} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 text-sm font-semibold text-secondary-foreground hover:brightness-110 disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar CEP
          </button>
        </div>
        {msg && <p role="status" className="mt-1 text-xs text-muted-foreground">{msg}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        {field('street', 'Logradouro', { required: true, placeholder: 'Rua, avenida, quadra...', autoComplete: 'address-line1' })}
        {field('number', 'Número', { required: true, placeholder: 'Nº', maxLength: 20 })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field('complement', 'Complemento', { placeholder: 'Casa, apto, bloco...', autoComplete: 'address-line2' })}
        {field('district', 'Bairro', { required: true })}
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
        {field('city', 'Cidade', { required: true, autoComplete: 'address-level2' })}
        {field('uf', 'UF', { required: true, placeholder: 'GO', maxLength: 2, autoComplete: 'address-level1' })}
      </div>
      {field('reference', 'Ponto de referência', { placeholder: 'Ex.: próximo à praça' })}
    </div>
  );
}
