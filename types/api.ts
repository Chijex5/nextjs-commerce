// API Request Body Types
// These interfaces define the structure of request bodies for various API endpoints

// Product API Types
export interface ProductImageInput {
  url: string;
  width?: number;
  height?: number;
  position?: number;
  isFeatured?: boolean;
}

export interface SizePriceRule {
  from: string | number;
  price: string | number;
}

export interface CreateProductBody {
  title: string;
  handle: string;
  description?: string;
  descriptionHtml?: string;
  availableForSale?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  images?: ProductImageInput[];
  sizes?: string[];
  colors?: string[];
  basePrice?: number;
  colorPrices?: Record<string, number>;
  largeSizePrice?: number | null;
  largeSizeFrom?: number | null;
  sizePriceRules?: SizePriceRule[];
  collectionIds?: string[];
}

export interface UpdateProductBody {
  title?: string;
  handle?: string;
  description?: string;
  descriptionHtml?: string;
  availableForSale?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  images?: ProductImageInput[];
  sizes?: string[];
  colors?: string[];
  basePrice?: number;
  colorPrices?: Record<string, number>;
  largeSizePrice?: number | null;
  largeSizeFrom?: number | null;
  sizePriceRules?: SizePriceRule[];
  collectionIds?: string[];
}

// Collection API Types
export interface CreateCollectionBody {
  handle: string;
  title: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface UpdateCollectionBody {
  handle?: string;
  title?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
}

// Menu API Types
export interface CreateMenuBody {
  handle: string;
  title: string;
}

export interface UpdateMenuBody {
  handle?: string;
  title?: string;
}

// Menu Item API Types
export interface CreateMenuItemBody {
  menuId: string;
  title: string;
  url: string;
  position?: number;
}

export interface UpdateMenuItemBody {
  menuId?: string;
  title?: string;
  url?: string;
  position?: number;
}

// Page API Types
export interface CreatePageBody {
  title: string;
  handle: string;
  body?: string;
  bodySummary?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface UpdatePageBody {
  title?: string;
  handle?: string;
  body?: string;
  bodySummary?: string;
  seoTitle?: string;
  seoDescription?: string;
}

// Admin API Types
export interface CreateAdminBody {
  email: string;
  password: string;
  name?: string;
  role?: string;
}

export interface UpdateAdminBody {
  email?: string;
  password?: string;
  name?: string;
  role?: string;
  isActive?: boolean;
}

// Order API Types
export interface UpdateOrderBody {
  status?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  notes?: string;
}

// Coupon API Types
export interface CreateCouponBody {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom?: string;
  validTo?: string;
  usageLimit?: number;
  active?: boolean;
  description?: string;
  discountType?: string;
  discountValue?: number;
  minOrderValue?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  requiresLogin?: boolean;
  startDate?: string;
  expiryDate?: string;
  isActive?: boolean;
  autoGenerate?: boolean;
}

export interface UpdateCouponBody {
  code?: string;
  type?: "percentage" | "fixed";
  value?: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom?: string;
  validTo?: string;
  usageLimit?: number;
  active?: boolean;
  description?: string;
  discountValue?: number;
  minOrderValue?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  startDate?: string;
  expiryDate?: string;
  isActive?: boolean;
}

// Custom Order API Types
export interface CreateCustomOrderBody {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  items: Array<{
    productVariantId: string;
    quantity: number;
    price: string;
  }>;
  subtotal: string;
  tax?: string;
  shipping?: string;
  total: string;
  notes?: string;
}

export interface UpdateCustomOrderBody {
  status?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  notes?: string;
}

// Product Variant API Types
export interface CreateProductVariantBody {
  title: string;
  price: string;
  currencyCode?: string;
  availableForSale?: boolean;
  selectedOptions?: Array<{
    name: string;
    value: string;
  }>;
}

export interface UpdateProductVariantBody {
  title?: string;
  price?: string;
  currencyCode?: string;
  availableForSale?: boolean;
  selectedOptions?: Array<{
    name: string;
    value: string;
  }>;
}

// Review API Types
export interface UpdateReviewBody {
  status?: "pending" | "approved" | "rejected";
}

// User Auth API Types
export interface RegisterUserBody {
  email: string;
  password: string;
  name?: string;
}

export interface LoginUserBody {
  email: string;
  password: string;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileBody {
  name?: string;
  email?: string;
}

export interface CreateAddressBody {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: string;
  isDefault?: boolean;
}

export interface MagicLinkBody {
  email: string;
  callbackUrl?: string;
}

export interface DeleteUploadBody {
  publicId: string;
}

export interface UpdateAddressBody {
  type: "shipping" | "billing";
  address: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
    phone?: string;
  };
}

// Other API Types
export interface ValidateCouponBody {
  code: string;
  cartTotal: number;
  sessionId?: string;
}

export interface AbandonedCartBody {
  cartId: string;
  items: Array<{
    productTitle: string;
    variantTitle: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }>;
  cartTotal: number;
}

export interface ContactBody {
  name: string;
  email: string;
  message: string;
}

export interface NewsletterSubscribeBody {
  email: string;
  name?: string;
}

export interface UploadBody {
  image: string; // Base64 encoded image
  folder?: string;
}

export interface ReviewVoteBody {
  isHelpful: boolean;
}

export interface CreateReviewBody {
  productId: string;
  rating: number;
  title?: string;
  content?: string;
}

export interface CheckoutInitializeBody {
  email: string;
  phone: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  saveAddress: boolean;
  couponCode?: string;
  notes?: string;
}
