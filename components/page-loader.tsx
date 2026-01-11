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
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Spinner */}
      <div
        className={clsx(
          "animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-400",
          sizeClasses[size],
        )}
      />
      {/* Message */}
      {message && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={clsx(
          "fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-black/80",
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
