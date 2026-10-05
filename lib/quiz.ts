/* =====================================================================
 * QUIZ / ASSISTENTE DE SERVIÇO
 * Lógica simples e TRANSPARENTE de palavras-chave (sem IA):
 * 1. normaliza o texto (minúsculas, sem acentos);
 * 2. conta quantas palavras-chave de cada área aparecem;
 * 3. a área com mais ocorrências vence;
 * 4. sem nenhuma ocorrência → Reparos gerais (profissional Geral).
 * ===================================================================== */
import { AREA_TO_PROFESSIONAL, Professional, ServiceArea } from './constants';

/** Palavras-chave por área (já sem acento). Fácil de ampliar. */
export const KEYWORDS: Record<Exclude<ServiceArea, 'REPAROS'>, string[]> = {
  ELETRICA: [
    'lampada', 'tomada', 'fio', 'fiacao', 'disjuntor', 'energia', 'interruptor', 'iluminacao', 'luz',
    'curto', 'choque', 'eletric', 'quadro de luz', 'spot', 'luminaria', 'queda de energia',
  ],
  HIDRAULICA: [
    'torneira', 'cano', 'vazamento', 'vazando', 'pia', 'chuveiro', 'descarga', 'agua', 'sifao',
    'ralo', 'entupi', 'goteira', 'registro', 'caixa d', 'vaso', 'encanamento', 'mangueira',
  ],
  REFRIGERACAO: [
    'ar-condicionado', 'ar condicionado', 'climatizacao', 'nao gela', 'refrigeracao', 'gas do ar',
    'split', 'climatizador', 'ar nao', 'esquentando', 'pingando agua do ar',
  ],
  // Instalações só vence quando nenhuma outra área foi encontrada
  INSTALACOES: ['instalar', 'instalacao', 'montar', 'montagem', 'suporte', 'prateleira', 'cortina', 'varal', 'quadro', 'tv na parede'],
};

export interface QuizResult {
  area: ServiceArea;
  professional: Professional;
  matchedKeywords: string[];
  description: string; // descrição ORIGINAL do cliente, preservada
}

/** Remove acentos e deixa em minúsculas: "Lâmpada" → "lampada" */
export function normalizeText(text?: string | null): string {
  return (text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function classifyProblem(description: string): QuizResult {
  const text = normalizeText(description);
  const scores: { area: ServiceArea; hits: string[]; score: number }[] = [];

  // Peso: termos de refrigeração são muito específicos ("ar condicionado"), então
  // valem 2 pontos. Assim "ar-condicionado vazando água" vai para Refrigeração.
  const WEIGHTS = { ELETRICA: 1, HIDRAULICA: 1, REFRIGERACAO: 2 };
  (['ELETRICA', 'HIDRAULICA', 'REFRIGERACAO'] as const).forEach((area: 'ELETRICA' | 'HIDRAULICA' | 'REFRIGERACAO') => {
    const hits = (KEYWORDS[area] ?? []).filter((kw: string) => text.includes(kw));
    scores.push({ area, hits, score: hits.length * WEIGHTS[area] });
  });

  const best = scores.sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))?.[0];

  let area: ServiceArea = 'REPAROS';
  let matched: string[] = [];
  if (best && (best?.hits?.length ?? 0) > 0) {
    area = best.area;
    matched = best.hits;
  } else {
    const installHits = (KEYWORDS.INSTALACOES ?? []).filter((kw: string) => text.includes(kw));
    if (installHits.length > 0) {
      area = 'INSTALACOES';
      matched = installHits;
    }
  }

  return { area, professional: AREA_TO_PROFESSIONAL[area], matchedKeywords: matched, description: description ?? '' };
}

/** Produtos sugeridos: os da mesma área, priorizando os que têm tags citadas no texto */
export function suggestProducts<T extends { serviceArea: string; tags: string[]; available: boolean }>(
  products: T[],
  result: QuizResult,
  limit = 4,
): T[] {
  const text = normalizeText(result?.description);
  // Reparos gerais e Instalações compartilham os mesmos itens de ferragens
  const areas: string[] = result?.area === 'REPAROS' || result?.area === 'INSTALACOES' ? ['REPAROS', 'INSTALACOES'] : [result?.area];
  const sameArea = (products ?? []).filter((p: T) => p?.available && areas.includes(p?.serviceArea));
  const scored = sameArea.map((p: T) => ({ p, score: (p?.tags ?? []).filter((t: string) => text.includes(normalizeText(t))).length }));
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.p);
}
