import { CheckoutFlow } from './_components/checkout-flow';

export const metadata = { title: 'Finalizar pedido | JC Resolve' };

export default function CheckoutPage() {
  return (
    <div className="bg-muted py-10">
      <div className="container-jc">
        <h1 className="font-display text-3xl font-extrabold">Finalizar pedido</h1>
        <p className="mt-1 text-muted-foreground">Siga as etapas para revisar, pagar, informar o endereço e agendar o atendimento.</p>
        <CheckoutFlow />
      </div>
    </div>
  );
}
