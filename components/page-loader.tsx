import clsx from "clsx";

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
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Enhanced Multi-ring Spinner */}
      <div className="relative">
        {/* Outer ring */}
        <div
          className={clsx(
            "absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400",
            sizeClasses[size],
          )}
          style={{ animationDuration: "1s" }}
        />
        {/* Middle ring */}
        <div
          className={clsx(
            "absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-purple-600 dark:border-r-purple-400",
            sizeClasses[size],
          )}
          style={{ animationDuration: "1.5s", animationDirection: "reverse" }}
        />
        {/* Inner ring */}
        <div
          className={clsx(
            "animate-spin rounded-full border-4 border-neutral-200 border-b-pink-600 dark:border-neutral-700 dark:border-b-pink-400",
            sizeClasses[size],
          )}
          style={{ animationDuration: "2s" }}
        />
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 animate-pulse rounded-full bg-gradient-to-r from-blue-600 to-purple-600" />
        </div>
      </div>

      {/* Message with enhanced styling */}
      {message && (
        <div className="text-center">
          <p className="animate-pulse text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {message}
          </p>
          {/* Loading dots animation */}
          <div className="mt-2 flex items-center justify-center gap-1">
            <span
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600 dark:bg-blue-400"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-600 dark:bg-purple-400"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-pink-600 dark:bg-pink-400"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={clsx(
          "fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm dark:bg-black/90",
          className,
        )}
      >
        {/* Decorative background elements */}
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute left-1/4 top-1/4 h-64 w-64 animate-pulse rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 animate-pulse rounded-full bg-gradient-to-br from-purple-400/30 to-pink-400/30 blur-3xl" />
        </div>
        <div className="relative">{loaderContent}</div>
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
