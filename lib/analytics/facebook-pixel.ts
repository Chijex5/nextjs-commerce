// Facebook Pixel tracking utilities
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

// Validate FB Pixel ID is set
if (!FB_PIXEL_ID && typeof window !== 'undefined') {
  console.warn('Facebook Pixel ID is not set. Facebook tracking will not be active.');
}

// Extend Window interface for fbq
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

/**
 * Track page views
 */
export const pageview = () => {
  if (typeof window !== 'undefined' && window.fbq && FB_PIXEL_ID) {
    window.fbq('track', 'PageView');
  }
};

/**
 * Track custom events
 * @param name - The name of the event
 * @param options - Optional parameters for the event
 */
export const event = (name: string, options: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.fbq && FB_PIXEL_ID) {
    window.fbq('track', name, options);
  }
};
