// TikTok Pixel tracking utilities
export const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

// Validate TikTok Pixel ID is set
if (!TIKTOK_PIXEL_ID && typeof window !== 'undefined') {
  console.warn('TikTok Pixel ID is not set. TikTok tracking will not be active.');
}

// Extend Window interface for ttq
declare global {
  interface Window {
    ttq: {
      page: () => void;
      track: (eventName: string, properties?: Record<string, any>) => void;
      identify: (properties?: Record<string, any>) => void;
      instances: (id: string) => any;
      load: (id: string, options?: Record<string, any>) => void;
      _i: Record<string, any[]>;
      _t: Record<string, number>;
      _o: Record<string, any>;
    };
    TiktokAnalyticsObject: string;
  }
}

const normalizePii = (value: string) => value.trim().toLowerCase();

const hashPii = async (value: string) => {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    return null;
  }

  const data = new TextEncoder().encode(normalizePii(value));
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

/**
 * Track page views
 */
export const pageview = () => {
  if (typeof window !== 'undefined' && window.ttq && TIKTOK_PIXEL_ID) {
    window.ttq.page();
  }
};

/**
 * Track custom events
 * @param name - The name of the event
 * @param options - Optional parameters for the event
 */
export const event = (name: string, options: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.ttq && TIKTOK_PIXEL_ID) {
    window.ttq.track(name, options);
  }
};

/**
 * Identify user with hashed PII (email/phone/external ID)
 */
export const identifyUser = async (data: {
  email?: string | null;
  phoneNumber?: string | null;
  externalId?: string | null;
}) => {
  if (typeof window === "undefined" || !window.ttq || !TIKTOK_PIXEL_ID) {
    return;
  }

  const [email, phoneNumber, externalId] = await Promise.all([
    data.email ? hashPii(data.email) : Promise.resolve(null),
    data.phoneNumber ? hashPii(data.phoneNumber) : Promise.resolve(null),
    data.externalId ? hashPii(data.externalId) : Promise.resolve(null),
  ]);

  const payload: Record<string, string> = {};
  if (email) payload.email = email;
  if (phoneNumber) payload.phone_number = phoneNumber;
  if (externalId) payload.external_id = externalId;

  if (Object.keys(payload).length === 0) {
    return;
  }

  window.ttq.identify(payload);
};
