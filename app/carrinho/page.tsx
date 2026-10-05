import { CartView } from './_components/cart-view';

export const metadata = { title: 'Carrinho | JC Resolve' };

export default function CarrinhoPage() {
  return (
    <div className="bg-muted py-10">
      <div className="container-jc">
        <h1 className="font-display text-3xl font-extrabold">Carrinho</h1>
        <p className="mt-1 text-muted-foreground">Revise produtos e serviço antes de seguir para o checkout.</p>
        <CartView />
      </div>
    </div>
  );
}
