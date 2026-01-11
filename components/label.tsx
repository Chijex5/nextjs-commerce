import clsx from "clsx";

const Label = ({
  title,
  amount,
  currencyCode,
  minAmount,
  position = "bottom",
}: {
  title: string;
  amount: string;
  currencyCode: string;
  minAmount?: string;
  position?: "bottom" | "center";
}) => {
  // Format prices inline instead of using the Price component
  // This allows us to combine min and max prices into a single display
  const formatPrice = (price: string) => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "narrowSymbol",
    }).format(parseFloat(price));
  };

  const priceDisplay = minAmount
    ? `${formatPrice(minAmount)} - ${formatPrice(amount)}`
    : formatPrice(amount);

  return (
    <div
      className={clsx(
        "absolute bottom-0 left-0 flex w-full px-4 pb-4 @container/label",
        {
          "lg:px-20 lg:pb-[35%]": position === "center",
        },
      )}
    >
      <div className="flex items-center rounded-full border bg-white/70 p-1 text-xs font-semibold text-black backdrop-blur-md dark:border-neutral-800 dark:bg-black/70 dark:text-white">
        <h3 className="mr-4 line-clamp-2 grow pl-2 leading-none tracking-tight">
          {title}
        </h3>
        <p
          suppressHydrationWarning={true}
          className="flex-none rounded-full bg-blue-600 p-2 text-white"
        >
          {priceDisplay}
          <span className="ml-1 inline hidden @[275px]/label:inline">
            {currencyCode}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Label;
