import { HERO_PHOTOS } from "lib/data/editorial";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

/** Split screen: photo + brand line on desktop, just the form on phones. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const photo = HERO_PHOTOS[2]!;

  return (
    <div className="grid min-h-[calc(100svh-3.5rem)] bg-canvas text-fg md:min-h-[calc(100svh-4rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <p className="display absolute bottom-10 left-12 right-12 text-[clamp(3rem,6vw,6rem)] text-paper">
          Made by hand.
          <br />
          Made for you.
        </p>
      </div>
      <div className="flex items-start justify-center px-4 py-10 sm:px-8 sm:py-16 lg:items-center">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
