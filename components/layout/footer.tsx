import NewsletterForm from "components/newsletter-form";
import { getMenu } from "lib/database";
import type { Menu } from "lib/shopify/types";
import Link from "next/link";
import { FaInstagram, FaSnapchat, FaTiktok, FaWhatsapp } from "react-icons/fa";

const { COMPANY_NAME, SITE_NAME } = process.env;

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://instagram.com/d__footprint",
    icon: FaInstagram,
  },
  { label: "TikTok", href: "https://tiktok.com/@d_footprint", icon: FaTiktok },
  { label: "WhatsApp", href: "https://wa.me/2348121993874", icon: FaWhatsapp },
  {
    label: "Snapchat",
    href: "https://snapchat.com/t/To9LQPVS",
    icon: FaSnapchat,
  },
];

const SHOP_FALLBACK: Menu[] = [
  { title: "All designs", path: "/products" },
  { title: "New in", path: "/search?sort=latest-desc" },
  { title: "Best sellers", path: "/search?sort=trending-desc" },
  { title: "Custom orders", path: "/custom-orders" },
];

const HELP: Menu[] = [
  { title: "Sizing guide", path: "/sizing-guide" },
  { title: "Care instructions", path: "/care-instructions" },
  { title: "Shipping & returns", path: "/shipping-returns" },
  { title: "FAQ", path: "/faq" },
  { title: "Track an order", path: "/orders" },
];

const HOUSE: Menu[] = [
  { title: "About us", path: "/about-us" },
  { title: "Contact", path: "/contact" },
  { title: "Privacy policy", path: "/privacy-policy" },
];

export default async function Footer() {
  const menu = await getMenu("footer-menu");
  const year = new Date().getFullYear();
  const name = COMPANY_NAME || SITE_NAME || "D'FOOTPRINT";

  return (
    <footer className="border-t border-line bg-canvas text-fg">
      <div className="grid gap-12 px-4 py-16 sm:px-8 md:px-12 lg:grid-cols-12 lg:gap-6 lg:py-20">
        <div className="lg:col-span-5">
          <p className="display text-[clamp(2.4rem,6vw,4.5rem)]">
            First to know.
          </p>
          <p className="mt-4 max-w-[38ch] text-fg-2">
            New designs, restocks and the odd offer. No spam — unsubscribe any
            time.
          </p>
          <div className="mt-6 max-w-md">
            <NewsletterForm />
          </div>
        </div>

        <FooterColumn
          title="Shop"
          items={menu.length ? menu : SHOP_FALLBACK}
          className="lg:col-span-2 lg:col-start-7"
        />
        <FooterColumn title="Help" items={HELP} className="lg:col-span-2" />
        <div className="lg:col-span-2">
          <FooterColumn title="House" items={HOUSE} />
          <ul className="mt-8 flex gap-2">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid size-10 place-items-center border border-line transition-colors hover:border-fg hover:bg-fg hover:text-canvas"
                >
                  <Icon className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="label flex flex-col gap-2 border-t border-line px-4 py-5 text-fg-3 sm:flex-row sm:justify-between sm:px-8 md:px-12">
        <span>
          © {year} {name}
        </span>
        <span>Handmade in Lagos, Nigeria</span>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
  className,
}: {
  title: string;
  items: Menu[];
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="label mb-5 text-fg-3">{title}</p>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.path}>
            <Link
              href={item.path}
              className="text-sm text-fg-2 transition-colors hover:text-fg"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
