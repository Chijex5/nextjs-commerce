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
    <div className="dp-icon-btn relative">
      <ShoppingCartIcon
        style={{width: "1rem", height: "1rem"}}
      />

      {quantity ? (
        <div className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white">
          {quantity}
        </div>
      ) : null}
    </div>
  );
}
