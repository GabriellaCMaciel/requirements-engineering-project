'use client';

/* Produtos (disponibilidade) e tabela dos tipos de serviço */
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Clock, Info, Package, Pencil, Plus, Trash2, Wrench } from 'lucide-react';
import { formatBRL, SERVICE_AREAS, SERVICE_TYPE_KEYS, SERVICE_TYPES, type ServiceArea } from '@/lib/constants';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { AdminProduct } from './types';

const AREA_KEYS = Object.keys(SERVICE_AREAS) as ServiceArea[];

interface FormState { name: string; description: string; price: string; serviceArea: ServiceArea; category: string; image: string; tags: string; available: boolean }
const EMPTY: FormState = { name: '', description: '', price: '', serviceArea: 'ELETRICA', category: '', image: '', tags: '', available: true };

export function ProductsPanel({ products }: { products: AdminProduct[] }) {
  const router = useRouter();
  const [savingId, setSavingId] = useState('');
  // Formulário de produto: editing === null → novo; senão edita o produto indicado
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<AdminProduct | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setEditing(null); setForm(EMPTY); setFormOpen(true); };
  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description, price: String(p.price).replace('.', ','), serviceArea: (p.serviceArea in SERVICE_AREAS ? p.serviceArea : 'REPAROS') as ServiceArea,
      category: p.category, image: p.image, tags: p.tags.join(', '), available: p.available,
    });
    setFormOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/admin/products/${editing.id}` : '/api/admin/products', {
        method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Não foi possível salvar o produto.');
      toast.success(editing ? 'Produto atualizado.' : 'Produto criado e já visível na Loja.');
      setFormOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro.');
    } finally {
      setSaving(false);
    }
  };

  const loadDemo = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/products/demo', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Não foi possível carregar os exemplos.');
      toast.success('Produtos de exemplo carregados.');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: AdminProduct) => {
    setSavingId(p.id);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Não foi possível excluir o produto.');
      toast.success(data.hidden ? `${p.name} já aparece em pedidos: foi ocultado da Loja em vez de excluído.` : `${p.name} excluído.`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro.');
    } finally {
      setSavingId('');
      setToDelete(null);
    }
  };

  const toggle = async (p: AdminProduct) => {
    setSavingId(p.id);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ available: !p.available }) });
      if (!res.ok) throw new Error('Não foi possível alterar o produto.');
      toast.success(`${p.name}: ${p.available ? 'indisponível na Loja' : 'disponível na Loja'}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro.');
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="space-y-6">
      <section className="card-jc p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Wrench className="h-5 w-5 text-deep" /> Tipos de agendamento</h2>
        <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Valores e durações de simulação. Para alterar, edite o arquivo <code>lib/constants.ts</code> (SERVICE_TYPES).</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {SERVICE_TYPE_KEYS.map((k) => (
            <div key={k} className="rounded-lg bg-muted p-4">
              <p className="font-bold">{SERVICE_TYPES[k].label}</p>
              <p className="font-display text-2xl font-extrabold">{formatBRL(SERVICE_TYPES[k].price)}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {SERVICE_TYPES[k].durationMin} min de agenda</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card-jc p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Package className="h-5 w-5 text-deep" /> Produtos da Loja <span className="text-sm font-normal text-muted-foreground">({products.length})</span></h2>
          <button type="button" onClick={openNew} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm hover:brightness-95">
            <Plus className="h-4 w-4" /> Novo produto
          </button>
        </div>
        {products.length === 0 && (
          <div className="mt-4 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p>Nenhum produto cadastrado ainda. Clique em “Novo produto” para começar ou carregue alguns exemplos.</p>
            <button type="button" onClick={loadDemo} disabled={saving} className="mt-3 inline-flex h-9 items-center rounded-lg border border-input bg-card px-3 text-sm font-semibold text-foreground hover:bg-background disabled:opacity-60">
              Carregar produtos de exemplo
            </button>
          </div>
        )}
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-lg bg-muted p-2.5 text-sm">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-card">
                {p.image ? <Image src={p.image} alt={p.name} fill sizes="48px" className="object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.category} • {formatBRL(p.price)}</p>
              </div>
              <button type="button" onClick={() => openEdit(p)} aria-label={`Editar ${p.name}`} title="Editar" className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground">
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setToDelete(p)} disabled={savingId === p.id} aria-label={`Excluir ${p.name}`} title="Excluir" className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-60">
                <Trash2 className="h-4 w-4" />
              </button>
              <button type="button" role="switch" aria-checked={p.available} aria-label={`Disponibilidade de ${p.name}`} disabled={savingId === p.id} onClick={() => toggle(p)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${p.available ? 'bg-success' : 'bg-slate-300'} disabled:opacity-60`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${p.available ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </li>
          ))}
        </ul>
      </section>
      <Dialog open={formOpen} onOpenChange={(o) => !saving && setFormOpen(o)}>
        <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editing ? 'Editar produto' : 'Novo produto'}</DialogTitle>
            <DialogDescription>As mudanças aparecem na Loja assim que você salvar.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="field-label" htmlFor="pf-name">Nome *</label>
              <input id="pf-name" className="field" value={form.name} onChange={(e) => set('name', e.target.value)} required maxLength={120} />
            </div>
            <div>
              <label className="field-label" htmlFor="pf-desc">Descrição</label>
              <textarea id="pf-desc" rows={3} maxLength={600} className="w-full rounded-lg border border-input p-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30" value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="pf-price">Preço (R$) *</label>
                <input id="pf-price" className="field" inputMode="decimal" placeholder="Ex.: 29,90" value={form.price} onChange={(e) => set('price', e.target.value)} required />
              </div>
              <div>
                <label className="field-label" htmlFor="pf-area">Área *</label>
                <select id="pf-area" className="field" value={form.serviceArea} onChange={(e) => set('serviceArea', e.target.value as ServiceArea)}>
                  {AREA_KEYS.map((k) => <option key={k} value={k}>{SERVICE_AREAS[k].label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="pf-cat">Categoria <span className="font-normal text-muted-foreground">(opcional — se vazio, usa a área)</span></label>
              <input id="pf-cat" className="field" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Ex.: Ferragens" />
            </div>
            <div>
              <label className="field-label" htmlFor="pf-img">Link da imagem <span className="font-normal text-muted-foreground">(opcional)</span></label>
              <input id="pf-img" className="field" value={form.image} onChange={(e) => set('image', e.target.value)} placeholder="https://..." />
              <p className="mt-1 text-xs text-muted-foreground">Deixe vazio para usar uma foto padrão da área escolhida.</p>
            </div>
            <div>
              <label className="field-label" htmlFor="pf-tags">Palavras-chave <span className="font-normal text-muted-foreground">(separadas por vírgula)</span></label>
              <input id="pf-tags" className="field" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="torneira, pia, vazamento" />
              <p className="mt-1 text-xs text-muted-foreground">Ajudam o assistente do site a sugerir este produto.</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.available} onChange={(e) => set('available', e.target.checked)} className="h-4 w-4" /> Disponível na Loja
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setFormOpen(false)} disabled={saving} className="h-10 rounded-lg px-4 text-sm font-medium hover:bg-muted">Cancelar</button>
              <button type="submit" disabled={saving} className="h-10 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-60">{saving ? 'Salvando…' : 'Salvar produto'}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{toDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>O produto some da Loja. Se ele já foi vendido em algum pedido, ele só será ocultado para preservar o histórico.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && remove(toDelete)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
