// Google Analytics 4 tracking utilities
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Validate GA_ID is set
if (!GA_ID && typeof window !== 'undefined') {
  console.warn('Google Analytics ID is not set. Analytics will not be tracked.');
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

/**
 * Track page views
 * @param url - The URL of the page being viewed
 */
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_ID) {
    window.gtag('config', GA_ID, {
      page_path: url,
    });
  }
};

/**
 * Track custom events
 * @param action - The action being tracked
 * @param category - The category of the event
 * @param label - Optional label for the event
 * @param value - Optional numeric value for the event
 */
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag && GA_ID) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
