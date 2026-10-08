import type { HomeData, HomeProduct } from "../home";

// Mock catalogue for DATA_SOURCE=mock. No images on purpose: the home page
// renders its illustrated product plates until real photography exists.
const product = (
  handle: string,
  title: string,
  amount: number,
  available = true,
): HomeProduct => ({
  id: `mock-${handle}`,
  handle,
  title,
  price: { amount: amount.toFixed(2), currencyCode: "NGN" },
  available,
});

const catalogue = [
  product("bar-slide-black", "Bar Slide — Black", 18500),
  product("twist-strap-bone", "Twist Strap — Bone", 21000),
  product("monk-buckle-slide", "Monk Buckle Slide", 26500),
  product("cross-strap-tan", "Cross Strap — Tan", 19500),
  product("woven-slipper-ink", "Woven Slipper — Ink", 24000),
  product("double-band-slide", "Double Band Slide", 17500),
  product("rose-detail-slide", "Rose Detail Slide", 23000, false),
  product("loafer-slipper-brown", "Loafer Slipper — Brown", 32000),
  product("chain-slide-black", "Chain Slide — Black", 22500),
  product("studded-band-slide", "Studded Band Slide", 27000),
];

export const mockHomeData: HomeData = {
  newArrivals: catalogue,
  bestSellers: [
    catalogue[2]!,
    catalogue[0]!,
    catalogue[4]!,
    catalogue[7]!,
    catalogue[1]!,
  ],
  collections: [
    {
      handle: "slides",
      title: "Slides",
      path: "/search/slides",
      productCount: 42,
    },
    {
      handle: "slippers",
      title: "Slippers",
      path: "/search/slippers",
      productCount: 27,
    },
    { handle: "men", title: "Men", path: "/search/men", productCount: 31 },
    {
      handle: "women",
      title: "Women",
      path: "/search/women",
      productCount: 38,
    },
  ],
};
