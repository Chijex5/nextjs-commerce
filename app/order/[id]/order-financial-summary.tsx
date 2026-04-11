import Price from "components/price";

type SummaryItem = {
  id: string;
  name: string;
  amount: string;
};

type OrderFinancialSummaryProps = {
  items: SummaryItem[];
  currencyCode: string;
  shippingAmount: string;
  discountAmount: string;
  couponCode?: string | null;
  totalPaid: string;
};

export default function OrderFinancialSummary({
  items,
  currencyCode,
  shippingAmount,
  discountAmount,
  couponCode,
  totalPaid,
}: OrderFinancialSummaryProps) {
  const hasDiscount = Number(discountAmount) > 0;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 md:p-6">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        Order summary
      </h2>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-4">
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              {item.name}
            </p>
            <Price
              amount={item.amount}
              currencyCode={currencyCode}
              currencyCodeClassName="hidden"
              className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <div className="flex items-center justify-between text-sm">
          <p className="text-neutral-600 dark:text-neutral-400">Delivery</p>
          <Price
            amount={shippingAmount}
            currencyCode={currencyCode}
            currencyCodeClassName="hidden"
            className="font-medium text-neutral-900 dark:text-neutral-100"
          />
        </div>

        {hasDiscount ? (
          <div className="mt-2 flex items-center justify-between text-sm">
            <p className="text-neutral-600 dark:text-neutral-400">
              Promo applied{couponCode ? ` (${couponCode})` : ""}
            </p>
            <Price
              amount={`-${Math.abs(Number(discountAmount)).toFixed(2)}`}
              currencyCode={currencyCode}
              currencyCodeClassName="hidden"
              className="font-medium text-neutral-900 dark:text-neutral-100"
            />
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-800">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Total paid
          </p>
          <Price
            amount={totalPaid}
            currencyCode={currencyCode}
            currencyCodeClassName="hidden"
            className="text-base font-semibold text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>
    </section>
  );
}
