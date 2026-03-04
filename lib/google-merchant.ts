import crypto from "node:crypto";

const GOOGLE_TOKEN_URLS = [
  "https://oauth2.googleapis.com/token",
  "https://www.googleapis.com/oauth2/v4/token",
] as const;
const GOOGLE_CONTENT_SCOPE = "https://www.googleapis.com/auth/content";
const GOOGLE_CONTENT_API_BASE =
  "https://shoppingcontent.googleapis.com/content/v2.1";
const GOOGLE_TOKEN_REQUEST_TIMEOUT_MS = 15_000;
const GOOGLE_TOKEN_MAX_ATTEMPTS_PER_URL = 3;
const GOOGLE_TOKEN_RETRY_BACKOFF_MS = 600;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const base64UrlEncode = (value: string | Buffer) =>
  (typeof value === "string" ? Buffer.from(value) : value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const stringifyPayload = (value: unknown) => JSON.stringify(value);

const parseGoogleApiErrorMessage = (payload: unknown, fallback: string) => {
  if (isRecord(payload)) {
    const maybeError = payload.error;
    if (isRecord(maybeError) && typeof maybeError.message === "string") {
      return maybeError.message;
    }

    if (typeof payload.error_description === "string") {
      return payload.error_description;
    }
  }

  return fallback;
};

const isRetryableStatus = (status: number) =>
  status === 408 || status === 429 || (status >= 500 && status <= 599);

const getErrorCode = (error: unknown) => {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return null;
};

const isRetryableNetworkError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const cause = "cause" in error ? error.cause : null;
  const causeCode = getErrorCode(cause);
  if (
    causeCode === "ETIMEDOUT" ||
    causeCode === "ECONNRESET" ||
    causeCode === "ENETUNREACH" ||
    causeCode === "EHOSTUNREACH"
  ) {
    return true;
  }

  const code = getErrorCode(error);
  if (
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ENETUNREACH" ||
    code === "EHOSTUNREACH"
  ) {
    return true;
  }

  return error.name === "AbortError";
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const getGoogleMerchantConfig = () => {
  const merchantId = process.env.GOOGLE_MERCHANT_ID?.trim();
  const serviceAccountEmail =
    process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey =
    process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n",
    );

  if (!merchantId) {
    throw new Error("GOOGLE_MERCHANT_ID is not configured");
  }

  if (!serviceAccountEmail) {
    throw new Error("GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL is not configured");
  }

  if (!privateKey) {
    throw new Error(
      "GOOGLE_MERCHANT_SERVICE_ACCOUNT_PRIVATE_KEY is not configured",
    );
  }

  return {
    merchantId,
    serviceAccountEmail,
    privateKey,
    contentLanguage: process.env.GOOGLE_MERCHANT_CONTENT_LANGUAGE || "en",
    targetCountry: process.env.GOOGLE_MERCHANT_TARGET_COUNTRY || "NG",
    channel: process.env.GOOGLE_MERCHANT_CHANNEL || "online",
    brand: process.env.GOOGLE_MERCHANT_BRAND || "D'FOOTPRINT",
  };
};

const createServiceAccountJwt = (params: {
  serviceAccountEmail: string;
  privateKey: string;
  tokenUrl: string;
}) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const claimSet = {
    iss: params.serviceAccountEmail,
    scope: GOOGLE_CONTENT_SCOPE,
    aud: params.tokenUrl,
    iat: issuedAt,
    exp: issuedAt + 3600,
  };

  const encodedHeader = base64UrlEncode(stringifyPayload(header));
  const encodedClaims = base64UrlEncode(stringifyPayload(claimSet));
  const unsignedToken = `${encodedHeader}.${encodedClaims}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign(params.privateKey);
  const encodedSignature = base64UrlEncode(signature);

  return `${unsignedToken}.${encodedSignature}`;
};

const fetchGoogleAccessToken = async (params: {
  serviceAccountEmail: string;
  privateKey: string;
}) => {
  const attemptErrors: string[] = [];

  for (const tokenUrl of GOOGLE_TOKEN_URLS) {
    for (
      let attempt = 1;
      attempt <= GOOGLE_TOKEN_MAX_ATTEMPTS_PER_URL;
      attempt += 1
    ) {
      const assertion = createServiceAccountJwt({
        ...params,
        tokenUrl,
      });
      const body = new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, GOOGLE_TOKEN_REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(tokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
          signal: controller.signal,
        });

        const payload = (await response.json().catch(() => null)) as unknown;

        if (!response.ok) {
          const message = parseGoogleApiErrorMessage(
            payload,
            "Failed to authenticate with Google Merchant API",
          );

          const shouldRetry =
            isRetryableStatus(response.status) &&
            attempt < GOOGLE_TOKEN_MAX_ATTEMPTS_PER_URL;

          if (shouldRetry) {
            attemptErrors.push(
              `${tokenUrl} attempt ${attempt} failed with status ${response.status}: ${message}`,
            );
            await wait(GOOGLE_TOKEN_RETRY_BACKOFF_MS * attempt);
            continue;
          }

          throw new Error(message);
        }

        if (!isRecord(payload) || typeof payload.access_token !== "string") {
          throw new Error("Google Merchant token response is missing access_token");
        }

        return payload.access_token;
      } catch (error) {
        const retryable =
          isRetryableNetworkError(error) &&
          attempt < GOOGLE_TOKEN_MAX_ATTEMPTS_PER_URL;

        const message = error instanceof Error ? error.message : String(error);
        attemptErrors.push(`${tokenUrl} attempt ${attempt} failed: ${message}`);

        if (retryable) {
          await wait(GOOGLE_TOKEN_RETRY_BACKOFF_MS * attempt);
          continue;
        }

        break;
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  throw new Error(
    [
      "Failed to authenticate with Google Merchant API.",
      "Google token endpoint requests timed out or failed across all retries.",
      `Attempts: ${attemptErrors.join(" | ")}`,
    ].join(" "),
  );
};

export type MerchantProductPayload = {
  offerId: string;
  title: string;
  description: string;
  link: string;
  imageLink?: string;
  additionalImageLinks?: string[];
  availability: "in stock" | "out of stock";
  priceValue: string;
  currencyCode: string;
};

export type MerchantInsertResult = {
  id: string | null;
  offerId: string;
  raw: unknown;
};

export type GoogleMerchantClient = {
  merchantId: string;
  upsertProduct: (product: MerchantProductPayload) => Promise<MerchantInsertResult>;
};

export async function createGoogleMerchantClient(): Promise<GoogleMerchantClient> {
  const config = getGoogleMerchantConfig();
  const accessToken = await fetchGoogleAccessToken({
    serviceAccountEmail: config.serviceAccountEmail,
    privateKey: config.privateKey,
  });

  return {
    merchantId: config.merchantId,
    upsertProduct: async (
      product: MerchantProductPayload,
    ): Promise<MerchantInsertResult> => {
      const requestBody: Record<string, unknown> = {
        offerId: product.offerId,
        title: product.title,
        description: product.description,
        link: product.link,
        contentLanguage: config.contentLanguage,
        targetCountry: config.targetCountry,
        channel: config.channel,
        availability: product.availability,
        condition: "new",
        price: {
          value: product.priceValue,
          currency: product.currencyCode,
        },
        brand: config.brand,
        identifierExists: false,
      };

      if (product.imageLink) {
        requestBody.imageLink = product.imageLink;
      }
      if (product.additionalImageLinks && product.additionalImageLinks.length > 0) {
        requestBody.additionalImageLinks = product.additionalImageLinks;
      }

      const response = await fetch(
        `${GOOGLE_CONTENT_API_BASE}/${encodeURIComponent(config.merchantId)}/products`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      );

      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        const message = parseGoogleApiErrorMessage(
          payload,
          `Failed to sync product ${product.offerId} to Google Merchant`,
        );
        throw new Error(message);
      }

      const googleId =
        isRecord(payload) && typeof payload.id === "string" ? payload.id : null;

      return {
        id: googleId,
        offerId: product.offerId,
        raw: payload,
      };
    },
  };
}

export function getGoogleMerchantId() {
  return process.env.GOOGLE_MERCHANT_ID?.trim() || null;
}
