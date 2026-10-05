/* Tipos serializáveis enviados do servidor para o painel (sem Date/BigInt) */
export interface AdminAppointment {
  id: string;
  orderId: string | null;
  orderCode: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  serviceArea: string;
  professional: string;
  serviceType: string;
  price: number;
  problemDescription: string;
  urgency: string;
  date: string;
  startMin: number;
  endMin: number;
  status: string;
  address: string | null;
  notes: string | null;
  isDemo: boolean;
  products: string[]; // produtos associados ao mesmo pedido (ex.: "2× Lâmpada LED")
}

export interface AdminOrder {
  id: string;
  code: string;
  status: string;
  createdAt: string; // ISO
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  productsSubtotal: number;
  serviceValue: number;
  discount: number;
  total: number;
  address: string;
  appointmentId: string | null;
}

export interface AdminProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  image: string;
}
