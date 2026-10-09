/**
 * Admin UI kit. Server-safe building blocks so every admin screen shares one
 * visual language with the storefront: hairline borders instead of cards with
 * shadows, condensed display type for titles and numbers, mono labels, and
 * colour reserved for meaning (status and change), never decoration.
 */
import clsx from "clsx";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

// ─── Page structure ───────────────────────────────────────────────────────────

export function Page({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "mx-auto w-full max-w-[1400px] px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Extra row under the title, e.g. range tabs or filters. */
  children?: ReactNode;
}) {
  return (
    <header className="mb-8 border-b border-line pb-6 lg:mb-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="label mb-3 text-fg-3">{eyebrow}</p> : null}
          <h1 className="display text-[clamp(2.4rem,6vw,4.25rem)] text-fg">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-[60ch] text-sm text-fg-3">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={clsx(
        "flex min-w-0 flex-col border border-line bg-canvas",
        className,
      )}
    >
      {title ? (
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold leading-tight text-fg">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-xs text-fg-3">{description}</p>
            ) : null}
          </div>
          {action ? (
            <TextLink href={action.href}>{action.label}</TextLink>
          ) : null}
        </div>
      ) : null}
      <div className={clsx("flex-1 p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function TextLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="label group inline-flex shrink-0 items-center gap-1 text-fg-3 transition-colors hover:text-fg"
    >
      {children}
      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

// ─── Numbers ──────────────────────────────────────────────────────────────────

export function Delta({
  value,
  inverse = false,
  suffix,
  className,
}: {
  /** Percent change; null = no baseline to compare against. */
  value: number | null;
  /** True when a decrease is good (e.g. cancellations, failures). */
  inverse?: boolean;
  suffix?: ReactNode;
  className?: string;
}) {
  if (value === null) {
    return (
      <span
        className={clsx(
          "inline-flex items-center gap-1 text-xs text-fg-3",
          className,
        )}
      >
        New {suffix}
      </span>
    );
  }
  const rounded = Math.round(value);
  const flat = rounded === 0;
  const good = inverse ? rounded < 0 : rounded > 0;
  const Icon = flat ? Minus : rounded > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-xs tabular-nums",
        flat
          ? "text-fg-3"
          : good
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-red-700 dark:text-red-400",
        className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={2} />
      <span className="font-medium">{Math.abs(rounded)}%</span>
      {suffix ? <span className="text-fg-3">{suffix}</span> : null}
    </span>
  );
}

export function Metric({
  label,
  value,
  change,
  inverse,
  hint,
  href,
  children,
  size = "md",
}: {
  label: string;
  value: ReactNode;
  change?: number | null;
  inverse?: boolean;
  hint?: ReactNode;
  href?: string;
  /** Visual under the number, e.g. a sparkline. */
  children?: ReactNode;
  size?: "md" | "lg";
}) {
  const body = (
    <>
      <p className="label text-fg-3">{label}</p>
      <p
        className={clsx(
          "mt-3 font-head font-extrabold leading-none tracking-tight text-fg tabular-nums [font-stretch:75%]",
          size === "lg"
            ? "text-[clamp(2.5rem,5vw,3.75rem)]"
            : "text-[clamp(1.9rem,3vw,2.5rem)]",
        )}
      >
        {value}
      </p>
      <div className="mt-2 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1">
        {change !== undefined ? (
          <Delta value={change} inverse={inverse} />
        ) : null}
        {hint ? <span className="text-xs text-fg-3">{hint}</span> : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </>
  );
  const className = "block min-w-0 bg-canvas p-5";
  return href ? (
    <Link
      href={href}
      className={clsx(className, "transition-colors hover:bg-plate/60")}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** Grid of metrics separated by hairlines (no gaps, no boxes-in-boxes). */
export function MetricGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("grid gap-px border border-line bg-line", className)}>
      {children}
    </div>
  );
}

// ─── Status ───────────────────────────────────────────────────────────────────

export type Tone = "neutral" | "info" | "positive" | "warning" | "critical";

const TONE_DOT: Record<Tone, string> = {
  neutral: "bg-fg-3",
  info: "bg-sky-600",
  positive: "bg-emerald-600",
  warning: "bg-amber-500",
  critical: "bg-red-600",
};

export function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap border border-line px-2 py-0.5 text-[11px] font-medium text-fg-2">
      <span
        className={clsx("size-1.5 rounded-full", TONE_DOT[tone])}
        aria-hidden
      />
      {children}
    </span>
  );
}

export const ORDER_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "warning" },
  processing: { label: "Processing", tone: "info" },
  completed: { label: "Completed", tone: "positive" },
  cancelled: { label: "Cancelled", tone: "critical" },
};

export const DELIVERY_STATUS: Record<string, { label: string; tone: Tone }> = {
  production: { label: "In production", tone: "neutral" },
  sorting: { label: "Packing", tone: "info" },
  dispatch: { label: "Out for delivery", tone: "info" },
  paused: { label: "Paused", tone: "warning" },
  completed: { label: "Delivered", tone: "positive" },
  cancelled: { label: "Cancelled", tone: "critical" },
};

export const PAYMENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  paid: { label: "Paid", tone: "positive" },
  conflict: { label: "Needs review", tone: "critical" },
  failed: { label: "Failed", tone: "critical" },
  initialized: { label: "Started", tone: "neutral" },
  processing: { label: "Processing", tone: "info" },
  duplicate: { label: "Duplicate", tone: "warning" },
};

export function OrderStatus({ status }: { status: string }) {
  const s = ORDER_STATUS[status] ?? {
    label: status.replace(/_/g, " "),
    tone: "neutral" as Tone,
  };
  return <StatusPill tone={s.tone}>{s.label}</StatusPill>;
}

export function DeliveryStatus({ status }: { status: string }) {
  const s = DELIVERY_STATUS[status] ?? {
    label: status.replace(/_/g, " "),
    tone: "neutral" as Tone,
  };
  return <StatusPill tone={s.tone}>{s.label}</StatusPill>;
}

// ─── Lists & breakdowns ───────────────────────────────────────────────────────

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-1 py-6">
      <p className="text-sm font-medium text-fg">{title}</p>
      {children ? <p className="text-xs text-fg-3">{children}</p> : null}
    </div>
  );
}

/**
 * Ranked horizontal bars (top products, regions, …). The bar sits behind the
 * row so labels never get squeezed, and the value column stays aligned.
 */
export function BarList({
  items,
  format,
  secondary,
  empty = "Nothing to show for this period.",
}: {
  items: Array<{
    id: string;
    label: string;
    value: number;
    secondary?: number;
    href?: string;
  }>;
  format: (value: number) => string;
  secondary?: (value: number) => string;
  empty?: string;
}) {
  if (items.length === 0) return <EmptyState title={empty} />;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-1.5">
      {items.map((item) => {
        const row = (
          <>
            <span
              className="absolute inset-y-0 left-0 bg-fg/[0.07] transition-colors group-hover:bg-fg/[0.12]"
              style={{ width: `${Math.max((item.value / max) * 100, 1.5)}%` }}
              aria-hidden
            />
            <span className="relative min-w-0 flex-1 truncate">
              {item.label}
            </span>
            {secondary && item.secondary !== undefined ? (
              <span className="relative hidden w-20 shrink-0 text-right text-xs text-fg-3 sm:block">
                {secondary(item.secondary)}
              </span>
            ) : null}
            <span className="relative w-24 shrink-0 text-right font-medium tabular-nums">
              {format(item.value)}
            </span>
          </>
        );
        const cls =
          "group relative flex h-9 items-center gap-3 px-2.5 text-sm text-fg";
        return (
          <li key={item.id}>
            {item.href ? (
              <Link href={item.href} className={cls}>
                {row}
              </Link>
            ) : (
              <div className={cls}>{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Label/value rows with hairline separators. */
export function StatList({ children }: { children: ReactNode }) {
  return <dl className="divide-y divide-line">{children}</dl>;
}

export function StatRow({
  label,
  value,
  tone,
  href,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: Tone;
  href?: string;
}) {
  const inner = (
    <>
      <dt className="text-sm text-fg-2">{label}</dt>
      <dd className="flex items-center gap-2 text-sm font-medium tabular-nums text-fg">
        {tone ? (
          <span
            className={clsx("size-1.5 rounded-full", TONE_DOT[tone])}
            aria-hidden
          />
        ) : null}
        {value}
      </dd>
    </>
  );
  const cls = "flex items-center justify-between gap-4 py-2.5";
  return href ? (
    <Link
      href={href}
      className={clsx(cls, "-mx-2 px-2 transition-colors hover:bg-plate/60")}
    >
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

// ─── Controls ─────────────────────────────────────────────────────────────────

/** Link-based segmented control: works without JS, keeps state in the URL. */
export function SegmentedLinks({
  options,
  active,
  hrefFor,
  label,
}: {
  options: Array<{ key: string; label: string }>;
  active: string;
  hrefFor: (key: string) => string;
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="no-scrollbar -mx-1 flex overflow-x-auto px-1"
    >
      <ul className="flex border border-line">
        {options.map((o) => {
          const isActive = o.key === active;
          return (
            <li key={o.key} className="border-r border-line last:border-r-0">
              <Link
                href={hrefFor(o.key)}
                aria-current={isActive ? "page" : undefined}
                scroll={false}
                className={clsx(
                  "flex h-9 items-center whitespace-nowrap px-3.5 font-mono text-[11px] uppercase tracking-wide transition-colors",
                  isActive
                    ? "bg-fg text-canvas"
                    : "text-fg-3 hover:bg-plate/60 hover:text-fg",
                )}
              >
                {o.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Saved-view tabs with counts (Shopify's "To fulfil · Unpaid · Open" row).
 * Link-based so each view is shareable and survives a refresh.
 */
export function ViewTabs({
  views,
  active,
  hrefFor,
  label,
}: {
  views: Array<{ key: string; label: string; count?: number; tone?: Tone }>;
  active: string;
  hrefFor: (key: string) => string;
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex min-w-max gap-6 border-b border-line">
        {views.map((v) => {
          const isActive = v.key === active;
          return (
            <li key={v.key}>
              <Link
                href={hrefFor(v.key)}
                aria-current={isActive ? "page" : undefined}
                scroll={false}
                className={clsx(
                  "-mb-px flex h-11 items-center gap-2 border-b-2 text-sm transition-colors",
                  isActive
                    ? "border-fg text-fg"
                    : "border-transparent text-fg-3 hover:text-fg",
                )}
              >
                {v.tone && v.count ? (
                  <span
                    className={clsx("size-1.5 rounded-full", TONE_DOT[v.tone])}
                    aria-hidden
                  />
                ) : null}
                {v.label}
                {v.count !== undefined ? (
                  <span
                    className={clsx(
                      "font-mono text-[11px] tabular-nums",
                      isActive ? "text-fg-2" : "text-fg-3",
                    )}
                  >
                    {v.count.toLocaleString("en-NG")}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  hrefFor,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const btn =
    "flex h-9 items-center border border-line px-3 font-mono text-[11px] uppercase tracking-wide transition-colors";
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <p className="text-xs text-fg-3 tabular-nums">
        {from.toLocaleString("en-NG")}–{to.toLocaleString("en-NG")} of{" "}
        {total.toLocaleString("en-NG")}
      </p>
      {pages > 1 ? (
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link
              href={hrefFor(page - 1)}
              className={clsx(btn, "text-fg hover:bg-fg hover:text-canvas")}
            >
              Previous
            </Link>
          ) : (
            <span className={clsx(btn, "text-fg-3 opacity-50")}>Previous</span>
          )}
          <span className="px-1 font-mono text-[11px] text-fg-3 tabular-nums">
            {page} / {pages}
          </span>
          {page < pages ? (
            <Link
              href={hrefFor(page + 1)}
              className={clsx(btn, "text-fg hover:bg-fg hover:text-canvas")}
            >
              Next
            </Link>
          ) : (
            <span className={clsx(btn, "text-fg-3 opacity-50")}>Next</span>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Search box + optional selects in one row; submits as a GET form. */
export function FilterBar({
  action,
  search,
  placeholder,
  hidden,
  children,
}: {
  action: string;
  search?: string;
  placeholder: string;
  /** Params to carry through (e.g. the active view). */
  hidden?: Record<string, string | undefined>;
  children?: ReactNode;
}) {
  return (
    <form
      action={action}
      method="get"
      className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center"
    >
      {Object.entries(hidden ?? {}).map(([k, v]) =>
        v ? <input key={k} type="hidden" name={k} value={v} /> : null,
      )}
      <label className="relative flex-1">
        <span className="sr-only">Search</span>
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder={placeholder}
          className="h-10 w-full border border-line bg-canvas px-3 text-sm text-fg outline-none placeholder:text-fg-3 focus:border-fg"
        />
      </label>
      {children}
      <button
        type="submit"
        className="h-10 border border-fg bg-fg px-4 font-mono text-[11px] uppercase tracking-wide text-canvas hover:opacity-85"
      >
        Search
      </button>
    </form>
  );
}

export function Select({
  name,
  defaultValue,
  options,
  label,
}: {
  name: string;
  defaultValue?: string;
  options: Array<{ value: string; label: string }>;
  label: string;
}) {
  return (
    <label className="flex">
      <span className="sr-only">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-10 w-full border border-line bg-canvas px-3 text-sm text-fg outline-none focus:border-fg sm:w-auto"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
