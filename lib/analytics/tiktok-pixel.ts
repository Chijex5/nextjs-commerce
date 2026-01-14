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
