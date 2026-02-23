import FooterMenu from "components/layout/footer-menu";
import LogoSquare from "components/logo-square";
import NewsletterForm from "components/newsletter-form";
import { getMenu } from "lib/database";
import Link from "next/link";
import { Suspense } from "react";

const { COMPANY_NAME, SITE_NAME } = process.env;

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  const copyrightDate = 2023 + (currentYear > 2023 ? `-${currentYear}` : "");
  const skeleton =
    "h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700";
  const menu = await getMenu("footer-menu");
  const copyrightName = COMPANY_NAME || SITE_NAME || "";

  return (
    <footer className="border-t border-neutral-200 bg-white text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
      <div className="mx-auto grid w-full max-w-[1800px] gap-10 px-4 py-12 md:grid-cols-[1.2fr_1fr_1.2fr] md:px-6 lg:px-8">
        <div className="space-y-4">
          <Link
            className="flex items-center gap-2 text-black dark:text-white"
            href="/"
          >
            <LogoSquare size="sm" />
            <span className="text-sm font-semibold uppercase tracking-wide">
              {SITE_NAME}
            </span>
          </Link>
          <p className="max-w-sm leading-6">
            Handcrafted footwear made with care in Lagos, Nigeria. Built for
            daily comfort and timeless style.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="space-y-3">
              <div className={skeleton} />
              <div className={skeleton} />
              <div className={skeleton} />
              <div className={skeleton} />
            </div>
          }
        >
          <FooterMenu menu={menu} />
        </Suspense>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-900 dark:text-neutral-100">
            Newsletter
          </h3>
          <p className="leading-6">
            Get product drops, restocks, and offers straight to your inbox.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-2 px-4 py-5 text-xs md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
          <p>
            &copy; {copyrightDate} {copyrightName}
            {copyrightName.length && !copyrightName.endsWith(".")
              ? "."
              : ""}{" "}
            All rights reserved.
          </p>
          <p>Quality handmade footwear for every occasion.</p>
        </div>
      </div>
    </footer>
  );
}
