import Link from "next/link";
import LogoSquare from "components/logo-square";

const SITE_NAME = "Politician Portfolio";
const OFFICE_NAME = "[Office Name]";

export default async function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { title: "About", href: "/about" },
    { title: "Achievements", href: "/achievements" },
    { title: "News", href: "/news" },
    { title: "Media", href: "/media" },
    { title: "Contact", href: "/contact" },
  ];

  return (
    <footer className="text-sm text-neutral-500 dark:text-neutral-400">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 border-t border-neutral-200 px-6 py-12 text-sm md:flex-row md:gap-12 md:px-4 min-[1320px]:px-0 dark:border-neutral-700">
        <div>
          <Link
            className="flex items-center gap-2 text-black md:pt-1 dark:text-white"
            href="/"
          >
            <LogoSquare size="sm" />
            <span className="uppercase">{SITE_NAME}</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm">
            Official website of {OFFICE_NAME}. Dedicated to transparency, accountability, and public service.
          </p>
        </div>
        
        <div className="md:ml-8">
          <h3 className="mb-4 font-semibold text-black dark:text-white">Quick Links</h3>
          <ul className="space-y-2">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="underline-offset-4 hover:text-black hover:underline dark:hover:text-neutral-300"
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:ml-auto">
          <h3 className="mb-4 font-semibold text-black dark:text-white">Connect</h3>
          <div className="space-y-2">
            <p>
              <a href="#" className="underline-offset-4 hover:underline">
                Twitter
              </a>
            </p>
            <p>
              <a href="#" className="underline-offset-4 hover:underline">
                Facebook
              </a>
            </p>
            <p>
              <a href="#" className="underline-offset-4 hover:underline">
                Instagram
              </a>
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-neutral-200 py-6 text-sm dark:border-neutral-700">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-1 px-4 md:flex-row md:gap-0 md:px-4 min-[1320px]:px-0">
          <p>
            &copy; {currentYear} {OFFICE_NAME}. All rights reserved.
          </p>
          <hr className="mx-4 hidden h-4 w-[1px] border-l border-neutral-400 md:inline-block" />
          <p>
            Built with Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}
