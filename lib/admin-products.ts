/* Validação dos dados de produto enviados pelo painel admin (servidor) */
import { SERVICE_AREAS, type ServiceArea } from './constants';

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  category: string;
  serviceArea: ServiceArea;
  image: string;
  tags: string[];
  available: boolean;
  stock: number;
}

type Result = { ok: true; data: ProductInput } | { ok: false; error: string };

/** Transforma o que veio do formulário em dados seguros, ou devolve a mensagem de erro. */
export function parseProductInput(body: unknown): Result {
  const b = (body ?? {}) as Record<string, unknown>;

  const name = String(b.name ?? '').trim();
  if (name.length < 3) return { ok: false, error: 'Informe o nome do produto (mínimo 3 letras).' };
  if (name.length > 120) return { ok: false, error: 'O nome do produto está muito longo.' };

  const description = String(b.description ?? '').trim();
  if (description.length > 600) return { ok: false, error: 'A descrição está muito longa (máximo 600 caracteres).' };

  // Aceita "12,90" e "12.90"
  const price = Number(String(b.price ?? '').replace(',', '.'));
  if (!Number.isFinite(price) || price <= 0 || price > 100000) return { ok: false, error: 'Informe um preço válido, maior que zero.' };

  const serviceArea = String(b.serviceArea ?? '') as ServiceArea;
  if (!(serviceArea in SERVICE_AREAS)) return { ok: false, error: 'Escolha uma área válida.' };

  const category = String(b.category ?? '').trim() || SERVICE_AREAS[serviceArea].label;

  // Imagem: endereço http(s) ou imagem do próprio site (/images/...). Vazio = foto padrão da área.
  let image = String(b.image ?? '').trim();
  if (!image) image = SERVICE_AREAS[serviceArea].image;
  if (!/^https?:\/\//i.test(image) && !image.startsWith('/')) {
    return { ok: false, error: 'O link da imagem deve começar com http:// ou https://.' };
  }

  const stock = Math.floor(Number(String(b.stock ?? '0').replace(',', '.')));
  if (!Number.isFinite(stock) || stock < 0 || stock > 100000) return { ok: false, error: 'Informe a quantidade em estoque (0 ou mais).' };

  const rawTags = Array.isArray(b.tags) ? b.tags : String(b.tags ?? '').split(',');
  const tags = rawTags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 12);

  return { ok: true, data: { name, description, price: Math.round(price * 100) / 100, category, serviceArea, image, tags, available: b.available !== false, stock } };
}

/** Gera um id legível e único a partir do nome (ex.: "torneira-cozinha-k3x9") */
export function makeProductId(name: string): string {
  const slug = name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'produto';
  return `${slug}-${Math.random().toString(36).slice(2, 6)}`;
}
