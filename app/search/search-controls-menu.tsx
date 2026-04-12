"use client";

import clsx from "clsx";
import type { SortFilterItem } from "lib/constants";
import type { Collection } from "lib/database";
import Link from "next/link";
import { useMemo, useState } from "react";

type SearchControlsMenuProps = {
  collections: Collection[];
  sorting: SortFilterItem[];
  pathname: string;
  query?: string;
  activeSortSlug: string | null;
  activeCollectionPath?: string;
};

export default function SearchControlsMenu({
  collections,
  sorting,
  pathname,
  query,
  activeSortSlug,
  activeCollectionPath,
}: SearchControlsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (query?.trim()) params.set("q", query.trim());
    return params;
  }, [query]);

  const buildHref = (options: { path?: string; sortSlug?: string | null }) => {
    const targetPath = options.path || pathname;
    const params = new URLSearchParams(queryParams);
    if (options.sortSlug) {
      params.set("sort", options.sortSlug);
    } else {
      params.delete("sort");
    }
    const search = params.toString();
    return search ? `${targetPath}?${search}` : targetPath;
  };

  return (
    <>
      <style>{`
        .scm-trigger {
          display: inline-flex; align-items: center; gap: .5rem;
          border: 1px solid var(--dp-border);
          background: var(--dp-card);
          color: var(--dp-sand);
          font-family: 'DM Sans', sans-serif;
          font-size: .65rem; font-weight: 500;
          letter-spacing: .14em; text-transform: uppercase;
          padding: .7rem 1.25rem;
          cursor: pointer;
          transition: border-color .22s, color .22s;
        }
        .scm-trigger:hover, .scm-trigger[aria-expanded="true"] {
          border-color: rgba(191,90,40,.45);
          color: var(--dp-cream);
        }

        .scm-panel {
          position: absolute;
          right: 0;
          top: calc(100% + .75rem);
          z-index: 30;
          width: min(92vw, 380px);
          background: var(--dp-card);
          border: 1px solid var(--dp-border);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          box-shadow: 0 24px 60px rgba(0,0,0,.5);
        }

        .scm-section-label {
          font-family: 'DM Sans', sans-serif;
          font-size: .58rem;
          font-weight: 500;
          letter-spacing: .22em;
          text-transform: uppercase;
          color: var(--dp-muted);
          margin-bottom: .65rem;
          display: block;
        }

        .scm-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid var(--dp-border);
          padding: .6rem .85rem;
          font-family: 'DM Sans', sans-serif;
          font-size: .75rem;
          color: var(--dp-muted);
          text-decoration: none;
          transition: border-color .2s, color .2s, background .2s;
        }
        .scm-option:hover {
          border-color: rgba(191,90,40,.35);
          color: var(--dp-sand);
        }
        .scm-option.active {
          background: var(--dp-cream);
          border-color: var(--dp-cream);
          color: var(--dp-ink);
        }

        .scm-close {
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: .62rem; font-weight: 500;
          letter-spacing: .14em; text-transform: uppercase;
          color: var(--dp-muted);
          transition: color .2s;
        }
        .scm-close:hover { color: var(--dp-cream); }

        .scm-scroll { max-height: 11rem; overflow-y: auto; display: flex; flex-direction: column; gap: .4rem; }
        .scm-scroll::-webkit-scrollbar { width: 3px; }
        .scm-scroll::-webkit-scrollbar-track { background: transparent; }
        .scm-scroll::-webkit-scrollbar-thumb { background: var(--dp-border); }
      `}</style>

      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-controls="search-controls-menu"
          className="scm-trigger"
        >
          <svg aria-hidden viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 5h14" strokeLinecap="round"/>
            <path d="M6 10h8" strokeLinecap="round"/>
            <path d="M8 15h4" strokeLinecap="round"/>
          </svg>
          Filter &amp; Sort
        </button>

        {isOpen && (
          <div id="search-controls-menu" className="scm-panel">
            {/* Panel header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p className="dp-label" style={{ color: "var(--dp-ember)" }}>Browse controls</p>
              <button type="button" onClick={() => setIsOpen(false)} className="scm-close">Close ×</button>
            </div>

            {/* Collections */}
            <div>
              <span className="scm-section-label">Collections</span>
              <div className="scm-scroll">
                {collections.map((collection) => {
                  const isActive = activeCollectionPath === collection.path;
                  return (
                    <Link
                      key={collection.handle}
                      href={buildHref({ path: collection.path, sortSlug: activeSortSlug })}
                      onClick={() => setIsOpen(false)}
                      className={clsx("scm-option", isActive && "active")}
                    >
                      <span>{collection.title}</span>
                      {isActive && (
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Sort */}
            <div>
              <span className="scm-section-label">Sort by</span>
              <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
                {sorting.map((option) => {
                  const isActive = option.slug === activeSortSlug;
                  return (
                    <Link
                      key={option.title}
                      href={buildHref({ sortSlug: option.slug })}
                      onClick={() => setIsOpen(false)}
                      className={clsx("scm-option", isActive && "active")}
                    >
                      <span>{option.title}</span>
                      {isActive && (
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}