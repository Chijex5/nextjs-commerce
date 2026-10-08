"use client";

import clsx from "clsx";
import { Eye, EyeOff } from "lucide-react";
import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

/**
 * Labelled text input. 16px text (so iOS never zooms on focus), 48px tall,
 * underline style that darkens on focus. Password fields get a show/hide
 * toggle; `hint` shows helper or error text underneath.
 */
export function Field({
  label,
  hint,
  error,
  className,
  type = "text",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  error?: boolean;
}) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={className}>
      <label htmlFor={id} className="label mb-1 block text-fg-3">
        {label}
        {props.required ? <span aria-hidden> *</span> : null}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && reveal ? "text" : type}
          aria-invalid={error || undefined}
          className={clsx(
            "h-12 w-full border-b bg-transparent text-base text-fg outline-none transition-colors placeholder:text-fg-3 focus:border-fg",
            error ? "border-red-600" : "border-line",
            isPassword && "pr-12",
          )}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="absolute right-0 top-0 grid h-12 w-12 place-items-center text-fg-3 hover:text-fg"
          >
            {reveal ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        ) : null}
      </div>
      {hint ? (
        <p
          className={clsx(
            "mt-1.5 text-xs",
            error ? "text-red-600" : "text-fg-3",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
