import clsx from "clsx";

interface PageLoaderProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

const SIZES = { sm: "size-10", md: "size-16", lg: "size-24" };

/**
 * Brand loader: the D'FOOTPRINT mark filling with ink from the bottom up.
 * Pure CSS (a mask over an animated gradient) so it costs nothing to show.
 */
const PageLoader = ({
  size = "md",
  message = "Loading",
  fullScreen = false,
  className,
}: PageLoaderProps) => {
  const content = (
    <div
      role="status"
      aria-live="polite"
      className={clsx("flex flex-col items-center gap-4", className)}
    >
      <span aria-hidden className={clsx("ink-logo", SIZES[size])} />
      {message ? (
        <span className="label text-fg-3">
          {message}
          <span className="ink-dots" />
        </span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center bg-canvas">
        {content}
      </div>
    );
  }
  return content;
};

export default PageLoader;
