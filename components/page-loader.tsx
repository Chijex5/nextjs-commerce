import clsx from "clsx";
import LogoIcon from "./icons/logo";

interface PageLoaderProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

const PageLoader = ({
  size = "md",
  message = "Loading...",
  fullScreen = false,
  className,
}: PageLoaderProps) => {
  const sizeClasses = {
    sm: { logo: "h-6 w-6", spinner: "h-10 w-10" },
    md: { logo: "h-8 w-8", spinner: "h-16 w-16" },
    lg: { logo: "h-12 w-12", spinner: "h-24 w-24" },
  };

  const sizes = sizeClasses[size];

  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Branded Spinner with Logo */}
      <div className="relative">
        {/* Rotating border */}
        <div
          className={clsx(
            "animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900 dark:border-neutral-800 dark:border-t-neutral-100",
            sizes.spinner,
          )}
          style={{ animationDuration: "1s" }}
        />

        {/* Logo in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <LogoIcon className={clsx(sizes.logo)} />
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {message}
          </p>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={clsx(
          "fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black",
          className,
        )}
      >
        {loaderContent}
      </div>
    );
  }

  return (
    <div className={clsx("flex items-center justify-center py-12", className)}>
      {loaderContent}
    </div>
  );
};

export default PageLoader;
