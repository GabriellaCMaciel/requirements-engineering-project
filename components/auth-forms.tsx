'use client';

/* Formulários de login e cadastro curto (reutilizados nas páginas
 * /login, /cadastro e na etapa "Identificação" do checkout). */
import Link from 'next/link';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail, MapPin, Phone, User, UserPlus } from 'lucide-react';

/** Máscara simples de telefone: (61) 99999-9999 */
export function maskPhone(v: string): string {
  const d = (v ?? '').replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
}
/** Máscara de CEP: 72870-000 */
export function maskCep(v: string): string {
  const d = (v ?? '').replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function IconInput({ id, label, icon: Icon, type = 'text', value, onChange, autoComplete, placeholder, inputMode, right }: {
  id: string; label: string; icon: React.ComponentType<{ className?: string }>; type?: string; value: string;
  onChange: (v: string) => void; autoComplete?: string; placeholder?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; right?: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} placeholder={placeholder} inputMode={inputMode} required className="field pl-10 pr-10" />
        {right}
      </div>
    </div>
  );
}

export function LoginForm({ onSuccess }: { onSuccess: (role: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1) valida credenciais para exibir mensagem clara
      const check = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await check.json().catch(() => ({}));
      if (!check.ok) throw new Error(data?.error ?? 'E-mail ou senha incorretos.');
      // 2) cria a sessão
      const res = await signIn('credentials', { email, password, redirect: false });
      if (res?.error) throw new Error('E-mail ou senha incorretos.');
      onSuccess(data?.role ?? 'CLIENT');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <IconInput id="login-email" label="E-mail" icon={Mail} type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="voce@email.com" />
      <IconInput
        id="login-senha" label="Senha" icon={Lock} type={show ? 'text' : 'password'} value={password} onChange={setPassword} autoComplete="current-password"
        right={<button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-muted-foreground">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
      />
      {error && <p role="alert" className="rounded-md bg-destructive/10 p-2.5 text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground shadow-sm hover:brightness-95 disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Entrar
      </button>
      <p className="text-center text-sm"><Link href="/recuperar-acesso" className="font-semibold text-deep hover:underline">Esqueci minha senha</Link></p>
    </form>
  );
}

export function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', cep: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: k === 'phone' ? maskPhone(v) : k === 'cep' ? maskCep(v) : v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Não foi possível criar a conta.');
      const login = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (login?.error) throw new Error('Conta criada, mas houve erro ao entrar. Tente fazer login.');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <IconInput id="cad-nome" label="Nome completo" icon={User} value={form.name} onChange={set('name')} autoComplete="name" placeholder="Seu nome completo" />
      <IconInput id="cad-email" label="E-mail" icon={Mail} type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="voce@email.com" />
      <div className="grid gap-4 sm:grid-cols-2">
        <IconInput id="cad-tel" label="Telefone" icon={Phone} type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="(61) 99999-9999" inputMode="tel" />
        <IconInput id="cad-cep" label="CEP" icon={MapPin} value={form.cep} onChange={set('cep')} autoComplete="postal-code" placeholder="72870-000" inputMode="numeric" />
      </div>
      <IconInput
        id="cad-senha" label="Senha (mín. 6 caracteres)" icon={Lock} type={show ? 'text' : 'password'} value={form.password} onChange={set('password')} autoComplete="new-password"
        right={<button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-muted-foreground">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
      />
      <p className="text-xs text-muted-foreground">O endereço completo só será pedido na finalização do pedido. Seus dados são usados apenas para o atendimento.</p>
      {error && <p role="alert" className="rounded-md bg-destructive/10 p-2.5 text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground shadow-sm hover:brightness-95 disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Criar conta
      </button>
    </form>
  );
}
