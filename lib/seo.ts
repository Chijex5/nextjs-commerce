import { baseUrl } from "lib/utils";

const trimTrailingSlash = (value: string) =>
  value.length > 1 ? value.replace(/\/+$/, "") : value;

const normalizePathname = (pathname: string) => {
  const [path] = pathname.split("?");
  if (!path) return "/";
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  return trimTrailingSlash(withLeadingSlash);
};

export const canonicalUrl = (pathname: string) => {
  const normalized = normalizePathname(pathname);
  if (normalized === "/") {
    return baseUrl;
  }
  return `${baseUrl}${normalized}`;
};

const hasValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value.some((entry) => entry.trim().length > 0);
  }

  return (value ?? "").trim().length > 0;
};

export const hasContentAffectingSearchParams = (
  searchParams: { [key: string]: string | string[] | undefined } | undefined,
  paramKeys: string[],
) => {
  if (!searchParams || paramKeys.length === 0) {
    return false;
  }

  return paramKeys.some((key) => hasValue(searchParams[key]));
};

export const canonicalHost = () => new URL(baseUrl).host;

export const siteName =
  process.env.SITE_NAME || process.env.COMPANY_NAME || "D'FOOTPRINT";

export const siteTagline =
  process.env.SITE_TAGLINE || "Perfect fit, perfect price";

export const socialLinks = [
  process.env.NEXT_PUBLIC_INSTAGRAM_URL,
  process.env.NEXT_PUBLIC_TIKTOK_URL,
  process.env.NEXT_PUBLIC_WHATSAPP_URL,
  process.env.NEXT_PUBLIC_SNAPCHAT_URL,
].filter((value): value is string => Boolean(value));

export const organizationJsonLd = () => {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: canonicalUrl("/"),
    slogan: siteTagline,
  };

  if (socialLinks.length > 0) {
    jsonLd.sameAs = socialLinks;
  }

  return jsonLd;
};

export const localBusinessJsonLd = () => {
  const businessPhone =
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE || process.env.BUSINESS_PHONE;
  const businessEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || process.env.BUSINESS_EMAIL;
  const businessStreetAddress =
    process.env.BUSINESS_STREET_ADDRESS ||
    "17 peace estate road along lasu road Iba Ipaye Lagos";

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ShoeStore",
    "@id": `${canonicalUrl("/")}#local-business`,
    name: siteName,
    url: canonicalUrl("/"),
    image: canonicalUrl("/opengraph-image"),
    description: siteTagline,
    areaServed: {
      "@type": "Country",
      name: "Nigeria",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: businessStreetAddress,
      addressCountry: "NG",
      addressRegion: process.env.BUSINESS_REGION || "Lagos",
      addressLocality: process.env.BUSINESS_LOCALITY || "Lagos",
    },
  };

  if (socialLinks.length > 0) {
    jsonLd.sameAs = socialLinks;
  }

  if (businessPhone) {
    jsonLd.telephone = businessPhone;
  }

  if (businessEmail) {
    jsonLd.email = businessEmail;
  }

  return jsonLd;
};
