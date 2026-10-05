/* Leitura de produtos no servidor + tipo serializável enviado ao navegador */
import { prisma } from './db';

export interface ProductDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  serviceArea: string;
  image: string;
  images: string[];
  tags: string[];
  available: boolean;
}

export async function getProducts(): Promise<ProductDTO[]> {
  try {
    const rows = await prisma.product.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
    return rows.map((p) => ({
      id: p.id, name: p.name, description: p.description, price: p.price, category: p.category,
      serviceArea: p.serviceArea, image: p.image, images: p.images ?? [], tags: p.tags ?? [], available: p.available,
    }));
  } catch (err) {
    console.error('Erro ao carregar produtos:', err);
    return [];
  }
}
