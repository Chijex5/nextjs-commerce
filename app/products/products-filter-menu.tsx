"use client";

import clsx from "clsx";
import type { SortFilterItem } from "lib/constants";
import Link from "next/link";
import { useState } from "react";

type ProductsFilterMenuProps = {
  sorting: SortFilterItem[];
  activeSortSlug: string | null;
};

export default function ProductsFilterMenu({
  sorting,
  activeSortSlug,
}: ProductsFilterMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        .pf-trigger {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: 1px solid rgba(242,232,213,0.2);
          color: #6A5A48;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 10px 18px;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .pf-trigger:hover,
        .pf-trigger[aria-expanded="true"] {
          border-color: rgba(242,232,213,0.35);
          color: #F2E8D5;
          background: rgba(242,232,213,0.05);
        }

        .pf-panel {
          position: absolute;
          right: 0;
          top: calc(100% + 10px);
          width: min(92vw, 340px);
          background: #0D0A07;
          border: 1px solid rgba(242,232,213,0.14);
          box-shadow: 0 32px 64px rgba(0,0,0,0.5);
          padding: 20px;
          z-index: 999;
        }

        .pf-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(242,232,213,0.08);
        }
        .pf-heading {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: #BF5A28;
        }
        .pf-close {
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #6A5A48;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
        }
        .pf-close:hover { color: #F2E8D5; }

        .pf-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pf-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid rgba(242,232,213,0.1);
          padding: 11px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          color: #6A5A48;
        }
        .pf-option:hover {
          border-color: rgba(242,232,213,0.28);
          color: #F2E8D5;
          background: rgba(242,232,213,0.03);
        }
        .pf-option-active {
          border-color: #BF5A28 !important;
          background: rgba(191,90,40,0.14) !important;
          color: #F2E8D5 !important;
        }

        .pf-check {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 14px;
          height: 14px;
          border: 1px solid #BF5A28;
          flex-shrink: 0;
        }
        .pf-check::after {
          content: '';
          display: block;
          width: 6px;
          height: 6px;
          background: #BF5A28;
        }
      `}</style>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="pf-panel"
        className="pf-trigger"
      >
        {/* Filter icon */}
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M3 5h14" strokeLinecap="round" />
          <path d="M6 10h8" strokeLinecap="round" />
          <path d="M8 15h4" strokeLinecap="round" />
        </svg>
        Sort &amp; Filter
      </button>

      {/* Panel */}
      {isOpen && (
        <div id="pf-panel" className="pf-panel" role="dialog" aria-label="Sort products">
          <div className="pf-panel-header">
            <span className="pf-heading">Sort products</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="pf-close"
            >
              Close ✕
            </button>
          </div>

          <ul className="pf-list">
            {sorting.map((option) => {
              const href = option.slug
                ? `/products?sort=${option.slug}`
                : "/products";
              const isActive = option.slug === activeSortSlug;

              return (
                <li key={option.title}>
                  <Link
                    href={href}
                    className={clsx("pf-option", isActive && "pf-option-active")}
                    onClick={() => setIsOpen(false)}
                  >
                    <span>{option.title}</span>
                    {isActive && <span className="pf-check" aria-label="Selected" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}