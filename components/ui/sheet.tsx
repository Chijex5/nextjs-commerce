"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

/**
 * Bottom sheet for phones (slides up, drag the handle down to close) that
 * becomes a right-hand drawer from md up. Built on Headless UI's Dialog, so
 * focus trapping, Esc and scroll locking come for free.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const startY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    setDragY(Math.max(0, e.clientY - startY.current));
  };
  const onPointerUp = () => {
    if (dragY > 90) onClose();
    startY.current = null;
    setDragY(0);
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/50 transition-opacity duration-300 data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 flex items-end md:items-stretch md:justify-end">
        <DialogPanel
          transition
          style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
          className="flex max-h-[88svh] w-full flex-col bg-canvas pb-[env(safe-area-inset-bottom)] text-fg transition-transform duration-500 ease-atelier data-[closed]:translate-y-full md:max-h-none md:w-[420px] md:data-[closed]:translate-x-full md:data-[closed]:translate-y-0"
        >
          <div
            className="flex touch-none justify-center pb-1 pt-3 md:hidden"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <span className="h-1 w-10 rounded-full bg-fg/20" />
          </div>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <DialogTitle className="label">{title}</DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-9 place-items-center"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            {children}
          </div>
          {footer ? (
            <div className="border-t border-line px-5 py-4">{footer}</div>
          ) : null}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
