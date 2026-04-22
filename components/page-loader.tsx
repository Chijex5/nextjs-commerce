import clsx from "clsx";
import LogoIcon from "./icons/logo";

interface PageLoaderProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: {
    outer: "h-11 w-11",
    inner: "h-8 w-8",
    logo: "h-5 w-5",
  },
  md: {
    outer: "h-[72px] w-[72px]",
    inner: "h-[52px] w-[52px]",
    logo: "h-7 w-7",
  },
  lg: {
    outer: "h-[108px] w-[108px]",
    inner: "h-20 w-20",
    logo: "h-10 w-10",
  },
};

const PageLoader = ({
  size = "md",
  message = "Loading…",
  fullScreen = false,
  className,
}: PageLoaderProps) => {
  const sizes = sizeClasses[size];

  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-5">
      {/* Dual-ring branded spinner */}
      <div className="relative flex items-center justify-center">
        {/* Outer ring — terracotta lead */}
        <div
          className={clsx(
            "animate-spin rounded-full border-[1.5px]",
            "border-[#F2E8D5]/[0.07] border-t-[#BF5A28]",
            sizes.outer,
          )}
          style={{ animationDuration: "1.2s", animationTimingFunction: "cubic-bezier(0.5,0,0.5,1)" }}
        />

        {/* Inner ring — gold, counter-rotates */}
        <div
          className={clsx(
            "absolute animate-spin rounded-full border-[1.5px]",
            "border-[#F2E8D5]/[0.04] border-b-[#C0892A]/50",
            sizes.inner,
          )}
          style={{
            animationDuration: "1.8s",
            animationDirection: "reverse",
            animationTimingFunction: "cubic-bezier(0.5,0,0.5,1)",
          }}
        />

        {/* Logo centred */}
        <div className="absolute flex items-center justify-center">
          <div className="flex items-center justify-center rounded-[3px] bg-[#F2E8D5]/[0.05]">
            <LogoIcon
              className={clsx(sizes.logo, "text-[#F2E8D5]/60")}
            />
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <p
          className="text-center text-[11px] uppercase tracking-[0.12em] text-[#F2E8D5]/40"
          style={{ fontFamily: "inherit" }}
        >
          {message}
        </p>
      )}
    </div>
  );

  /* fullScreen mode — fixed overlay covers entire viewport */
  if (fullScreen) {
    return (
      <div
        className={clsx(
          "fixed inset-0 z-50 flex items-center justify-center bg-[#0A0704]",
          className,
        )}
      >
        {/* Subtle grain texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
          }}
        />
        {loaderContent}
      </div>
    );
  }

  /* Default inline mode */
  return (
    <div
      className={clsx(
        "flex items-center justify-center py-12",
        className,
      )}
    >
      {loaderContent}
    </div>
  );
};

export default PageLoader;