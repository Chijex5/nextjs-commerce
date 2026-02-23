import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

export default function OpenCart({
  className,
  quantity,
}: {
  className?: string;
  quantity?: number;
}) {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-black transition-colors dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
      <ShoppingCartIcon
        className={clsx(
          "h-[18px] w-[18px] transition-all ease-in-out hover:scale-110",
          className,
        )}
      />

      {quantity ? (
        <div className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white dark:bg-white dark:text-black">
          {quantity}
        </div>
      ) : null}
    </div>
  );
}
