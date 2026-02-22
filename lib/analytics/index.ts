// Unified analytics tracking service
import * as ga from "./google-analytics";
import * as fbPixel from "./facebook-pixel";
import * as tiktok from "./tiktok-pixel";

/**
 * Track page views across all analytics platforms
 * @param url - The URL of the page being viewed
 */
export const trackPageView = (url: string) => {
  ga.pageview(url);
  fbPixel.pageview();
  tiktok.pageview();
};

/**
 * Track product views across all analytics platforms
 * @param product - Product information
 */
export const trackProductView = (product: {
  id: string;
  name: string;
  price: number;
  category?: string;
}) => {
  // Google Analytics
  ga.event({
    action: "view_item",
    category: "ecommerce",
    label: product.name,
    value: product.price,
  });

  // Facebook Pixel
  fbPixel.event("ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: product.price,
    currency: "NGN",
  });

  // TikTok Pixel
  tiktok.event("ViewContent", {
    contents: [
      {
        content_id: product.id,
        content_type: "product",
        content_name: product.name,
      },
    ],
    value: product.price,
    currency: "NGN",
  });
};

/**
 * Track add to cart events across all analytics platforms
 * @param product - Product information
 */
export const trackAddToCart = (product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}) => {
  // Google Analytics
  ga.event({
    action: "add_to_cart",
    category: "ecommerce",
    label: product.name,
    value: product.price * product.quantity,
  });

  // Facebook Pixel
  fbPixel.event("AddToCart", {
    content_ids: [product.id],
    content_name: product.name,
    value: product.price * product.quantity,
    currency: "NGN",
  });

  // TikTok Pixel
  tiktok.event("AddToCart", {
    contents: [
      {
        content_id: product.id,
        content_type: "product",
        content_name: product.name,
      },
    ],
    value: product.price * product.quantity,
    currency: "NGN",
  });
};

/**
 * Track checkout initiation across all analytics platforms
 * @param cartValue - Total cart value
 */
export const trackInitiateCheckout = (
  cartValue: number,
  items: Array<{ id: string; name: string; quantity: number }> = [],
) => {
  // Google Analytics
  ga.event({
    action: "begin_checkout",
    category: "ecommerce",
    value: cartValue,
  });

  // Facebook Pixel
  fbPixel.event("InitiateCheckout", {
    value: cartValue,
    currency: "NGN",
  });

  // TikTok Pixel
  tiktok.event("InitiateCheckout", {
    contents: items.map((item) => ({
      content_id: item.id,
      content_type: "product",
      content_name: item.name,
    })),
    value: cartValue,
    currency: "NGN",
  });
};

/**
 * Track purchase completion across all analytics platforms
 * @param order - Order information
 */
export const trackPurchase = (order: {
  orderId: string;
  value: number;
  items: Array<{ id: string; name: string; quantity: number }>;
}) => {
  // Google Analytics
  ga.event({
    action: "purchase",
    category: "ecommerce",
    label: order.orderId,
    value: order.value,
  });

  // Facebook Pixel
  fbPixel.event("Purchase", {
    value: order.value,
    currency: "NGN",
    content_ids: order.items.map((item) => item.id),
  });

  // TikTok Pixel
  const tiktokContents = order.items.map((item) => ({
    content_id: item.id,
    content_type: "product",
    content_name: item.name,
    num_items: item.quantity,
  }));

  tiktok.event("Purchase", {
    contents: tiktokContents,
    value: order.value,
    currency: "NGN",
  });

  tiktok.event("PlaceAnOrder", {
    contents: order.items.map((item) => ({
      content_id: item.id,
      content_type: "product",
      content_name: item.name,
      num_items: item.quantity,
    })),
    value: order.value,
    currency: "NGN",
  });
};

/**
 * Track user registration across all analytics platforms
 */
export const trackSignUp = () => {
  ga.event({
    action: "sign_up",
    category: "engagement",
  });

  fbPixel.event("CompleteRegistration");

  tiktok.event("CompleteRegistration");
};

/**
 * Track custom order requests
 */
export const trackCustomOrderRequest = () => {
  ga.event({
    action: "custom_order_request",
    category: "engagement",
  });

  fbPixel.event("Lead");

  tiktok.event("SubmitForm", {
    content_name: "Custom Order Request",
  });
};

/**
 * Track search results views with basic faceting context
 */
export const trackSearchResults = (payload: {
  query?: string;
  resultCount: number;
  sort?: string;
  page?: number;
  availableOnly?: boolean;
  tag?: string;
  minPrice?: number;
  maxPrice?: number;
}) => {
  const label = payload.query || "browse";

  ga.event({
    action: "search_results",
    category: "search",
    label,
    value: payload.resultCount,
  });

  fbPixel.event("Search", {
    search_string: label,
    content_category: payload.tag || "all",
    value: payload.resultCount,
    currency: "NGN",
  });

  tiktok.event("Search", {
    query: label,
    value: payload.resultCount,
    currency: "NGN",
    contents: payload.tag
      ? [{ content_id: payload.tag, content_type: "category" }]
      : undefined,
  });
};
