/* =====================================================================
 * CATÁLOGO DEMONSTRATIVO DA LOJA
 * ATENÇÃO: produtos, preços, imagens e disponibilidade são DADOS
 * DEMONSTRATIVOS para o protótipo. Substitua pela lista real da JC Resolve
 * e rode novamente o seed (yarn prisma db seed).
 * ===================================================================== */
export interface DemoProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  serviceArea: string;
  image: string;
  tags: string[];
  available: boolean;
}

const CDN = 'https://cdn.thewirecutter.com/wp-content/media/2024/02/smartledlightbulbs-2048px-07781-3x2-1.jpg?auto=webp&quality=75&crop=4:3,smart&width=1024';

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: 'lampada-led-9w', name: 'Lâmpada LED bulbo 9W', description: 'Lâmpada LED bulbo de luz branca, ideal para salas, quartos e cozinhas.', price: 12.9, category: 'Elétrica', serviceArea: 'ELETRICA', image: `${CDN}/1fe0481d-4ae9-4168-9464-99a9264dd6d8.png`, tags: ['lampada', 'luz', 'iluminacao'], available: true },
  { id: 'interruptor-simples', name: 'Interruptor simples 4x2', description: 'Interruptor de parede simples com placa 4x2 na cor branca.', price: 14.5, category: 'Elétrica', serviceArea: 'ELETRICA', image: `${CDN}/280d2c8c-68e5-43d0-8497-2917a9de75d3.png`, tags: ['interruptor', 'luz'], available: true },
  { id: 'tomada-2pt', name: 'Tomada 2P+T 10A', description: 'Tomada de parede padrão brasileiro (três pinos) com placa branca.', price: 16.9, category: 'Elétrica', serviceArea: 'ELETRICA', image: `${CDN}/ea57cf6d-1261-4c78-909b-b162be6758e9.png`, tags: ['tomada', 'energia'], available: true },
  { id: 'disjuntor-monopolar', name: 'Disjuntor monopolar DIN', description: 'Disjuntor monopolar para trilho DIN, usado em quadros de distribuição.', price: 24.9, category: 'Elétrica', serviceArea: 'ELETRICA', image: `${CDN}/39a5892d-a521-4b7d-817b-e804c0a8eb4a.png`, tags: ['disjuntor', 'quadro', 'energia'], available: true },
  { id: 'torneira-cozinha', name: 'Torneira de parede para cozinha', description: 'Torneira cromada de parede com bica móvel, para pias de cozinha.', price: 89.9, category: 'Hidráulica', serviceArea: 'HIDRAULICA', image: `${CDN}/e20d48a4-2c81-4726-8d8b-c33805912057.png`, tags: ['torneira', 'pia', 'cozinha'], available: true },
  { id: 'sifao-sanfonado', name: 'Sifão sanfonado universal', description: 'Sifão sanfonado em PVC, compatível com a maioria das pias e lavatórios.', price: 19.9, category: 'Hidráulica', serviceArea: 'HIDRAULICA', image: `${CDN}/7bef41f1-3eb5-4c19-8a63-a453d3e7c6ee.png`, tags: ['sifao', 'pia', 'vazamento', 'ralo'], available: true },
  { id: 'fita-veda-rosca', name: 'Fita veda rosca 18mm', description: 'Fita veda rosca para vedar conexões e evitar vazamentos.', price: 6.5, category: 'Hidráulica', serviceArea: 'HIDRAULICA', image: `${CDN}/6157956d-5560-4de8-9cb1-094b770a7d3b.png`, tags: ['vazamento', 'cano', 'torneira', 'registro'], available: true },
  { id: 'mangueira-jardim', name: 'Mangueira de jardim com esguicho', description: 'Mangueira flexível com esguicho, para jardins, quintais e limpeza.', price: 59.9, category: 'Hidráulica', serviceArea: 'HIDRAULICA', image: `${CDN}/8b3195dd-f891-4658-8502-f7b96515b397.png`, tags: ['mangueira', 'agua', 'jardim'], available: true },
  { id: 'reparo-descarga', name: 'Kit reparo para válvula de descarga', description: 'Conjunto de peças para reparo de válvula de descarga.', price: 34.9, category: 'Hidráulica', serviceArea: 'HIDRAULICA', image: `${CDN}/b5b023d0-44f3-4549-bf87-e3d16c56d37e.png`, tags: ['descarga', 'vaso', 'vazamento'], available: true },
  { id: 'suporte-ar-split', name: 'Suporte para condensadora split', description: 'Par de suportes metálicos para a unidade externa de ar-condicionado split.', price: 69.9, category: 'Refrigeração', serviceArea: 'REFRIGERACAO', image: `${CDN}/7db2f7e8-159e-4949-a296-3f4ddb95c974.png`, tags: ['ar condicionado', 'split', 'suporte', 'instalar'], available: true },
  { id: 'limpador-ar', name: 'Limpador higienizador para ar-condicionado', description: 'Spray para limpeza e higienização de aparelhos de ar-condicionado.', price: 29.9, category: 'Refrigeração', serviceArea: 'REFRIGERACAO', image: `${CDN}/f92bf768-2854-45be-9b5f-9e0abf2ba78d.png`, tags: ['ar condicionado', 'limpeza', 'nao gela', 'split'], available: true },
  { id: 'kit-buchas-parafusos', name: 'Kit buchas e parafusos', description: 'Caixa organizadora com buchas e parafusos de tamanhos variados.', price: 22.9, category: 'Ferragens', serviceArea: 'INSTALACOES', image: `${CDN}/f0c3e68a-ea9c-456c-84b6-56214da6e3d0.png`, tags: ['suporte', 'prateleira', 'quadro', 'instalar', 'cortina'], available: true },
];
