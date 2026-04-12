import clsx from "clsx";
import LogoIcon from "./icons/logo";

export default function LogoSquare({ size, forceStyle }: { size?: "sm" | undefined; forceStyle?: boolean }) {
  return (
    <div
      className={forceStyle? `dp-icon-btn` : clsx(
        "flex flex-none items-center justify-center text-[#bf5a28] border border-white border-1 bg-[rgba(191,90,40,0.11)]",
        {
          "h-[40px] w-[40px]": !size,
          "h-[30px] w-[30px]": size === "sm",
        },
      )}
    >
      <LogoIcon
        className={forceStyle ? '' : clsx({
          "h-[32px] w-[32px]": !size,
          "h-[10px] w-[10px]": size === "sm",
        })}
        style={forceStyle ? { width: "1rem", height: "1rem" } : undefined}
      />
    </div>
  );
}
