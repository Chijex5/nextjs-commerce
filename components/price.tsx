import clsx from "clsx";

const Price = ({
  amount,
  className,
  currencyCode = "USD",
  currencyCodeClassName,
}: {
  amount: string;
  className?: string;
  currencyCode: string;
  currencyCodeClassName?: string;
} & React.ComponentProps<"p">) => (
  <p
    suppressHydrationWarning={true}
    className={className}
    style={{
      color: "var(--gold, #C0892A)",
      fontWeight: 500,
      letterSpacing: "0.03em",
    }}
  >
    {`${new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "narrowSymbol",
    }).format(parseFloat(amount))}`}
    <span className={clsx("ml-1 inline", currencyCodeClassName)}>
      {`${currencyCode}`}
    </span>
  </p>
);

export default Price;