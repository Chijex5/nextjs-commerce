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
  const telephone =
    process.env.NEXT_PUBLIC_SUPPORT_PHONE || process.env.SUPPORT_PHONE;
  const email =
    process.env.SUPPORT_EMAIL ||
    process.env.ADMIN_EMAIL ||
    process.env.SMTP_FROM_EMAIL;

  const streetAddress = process.env.BUSINESS_STREET_ADDRESS;
  const addressLocality =
    process.env.BUSINESS_ADDRESS_LOCALITY || process.env.BUSINESS_CITY;
  const addressRegion =
    process.env.BUSINESS_ADDRESS_REGION || process.env.BUSINESS_STATE;
  const postalCode = process.env.BUSINESS_POSTAL_CODE;
  const addressCountry =
    process.env.BUSINESS_ADDRESS_COUNTRY || "NG";
  const priceRange = process.env.BUSINESS_PRICE_RANGE;
  const latitude = process.env.BUSINESS_LATITUDE;
  const longitude = process.env.BUSINESS_LONGITUDE;

  const hasAddress = streetAddress || addressLocality || addressRegion;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteName,
    url: canonicalUrl("/"),
    description: siteTagline,
    image: canonicalUrl("/opengraph-image"),
  };

  if (telephone) jsonLd.telephone = telephone;
  if (email) jsonLd.email = email;
  if (priceRange) jsonLd.priceRange = priceRange;
  if (socialLinks.length > 0) jsonLd.sameAs = socialLinks;

  if (hasAddress) {
    const address: Record<string, string> = {
      "@type": "PostalAddress",
      addressCountry,
    };
    if (streetAddress) address.streetAddress = streetAddress;
    if (addressLocality) address.addressLocality = addressLocality;
    if (addressRegion) address.addressRegion = addressRegion;
    if (postalCode) address.postalCode = postalCode;
    jsonLd.address = address;
  }

  if (latitude && longitude) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude,
      longitude,
    };
  }

  return jsonLd;
};
