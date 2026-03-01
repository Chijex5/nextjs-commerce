import OrderDetailClient from "./order-detail-client";

type OrderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;

  return <OrderDetailClient orderId={id} />;
}
