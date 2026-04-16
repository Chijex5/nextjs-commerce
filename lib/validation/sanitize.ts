import DOMPurify from "dompurify";

type PurifyConfig = {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
  KEEP_CONTENT?: boolean;
};

function stripHtmlFallback(value: string): string {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

function runDompurify(html: string, config: PurifyConfig): string {
  const purify: any = DOMPurify;

  if (typeof purify?.sanitize === "function") {
    return purify.sanitize(html, config);
  }

  if (typeof purify?.default?.sanitize === "function") {
    return purify.default.sanitize(html, config);
  }

  // Some runtimes expose DOMPurify as a factory function.
  if (typeof purify === "function" && typeof window !== "undefined") {
    const instance = purify(window as any);
    if (typeof instance?.sanitize === "function") {
      return instance.sanitize(html, config);
    }
  }

  return stripHtmlFallback(html);
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * Allows basic formatting tags: p, br, strong, em, u, ul, ol, li, h2, h3
 */
export function sanitizeHtml(html: string): string {
  const config: PurifyConfig = {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "ul", "ol", "li", "h2", "h3"],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  };
  return runDompurify(html, config);
}

/**
 * Sanitize plain text (remove any HTML tags)
 */
export function sanitizeText(text: string): string {
  return runDompurify(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Validate and sanitize product description
 */
export function validateAndSanitizeDescription(html: string): {
  valid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!html || typeof html !== "string") {
    return { valid: false, sanitized: "", error: "Description must be a string" };
  }

  if (html.length > 10000) {
    return { valid: false, sanitized: "", error: "Description too long (max 10000 characters)" };
  }

  const sanitized = sanitizeHtml(html);

  if (sanitized.length === 0 && html.length > 0) {
    return { valid: false, sanitized: "", error: "Description contains no valid content" };
  }

  return { valid: true, sanitized };
}
