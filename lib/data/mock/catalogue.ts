import type { CardProduct, ShopCollection } from "../types";

// Mock catalogue for DATA_SOURCE=mock. Images are free Unsplash TEST photos
// (Unsplash License) standing in for real product photography.
type MockProduct = CardProduct & { collections: string[]; createdAt: number };

let order = 0;
const product = (
  handle: string,
  title: string,
  amount: number,
  photoId: string,
  collections: string[],
  available = true,
): MockProduct => ({
  id: `mock-${handle}`,
  handle,
  title,
  price: { amount: amount.toFixed(2), currencyCode: "NGN" },
  image: { url: `https://images.unsplash.com/photo-${photoId}`, alt: title },
  available,
  collections,
  createdAt: order++,
});

export const MOCK_COLLECTIONS: ShopCollection[] = [
  { handle: "slides", title: "Slides", path: "/search/slides" },
  { handle: "slippers", title: "Slippers", path: "/search/slippers" },
  { handle: "men", title: "Men", path: "/search/men" },
  { handle: "women", title: "Women", path: "/search/women" },
];

export const MOCK_PRODUCTS: MockProduct[] = [
  product(
    "bar-slide-black-brown",
    "Bar Slide — Black/Brown",
    18500,
    "1585120824848-8a5cd41493d2",
    ["slides", "men"],
  ),
  product(
    "cross-strap-tan",
    "Cross Strap — Tan",
    19500,
    "1613662632164-7f2b081a5b46",
    ["slides", "women"],
  ),
  product(
    "buckle-slide-brown",
    "Buckle Slide — Brown",
    26500,
    "1625563206627-7e713d1ac0a8",
    ["slides", "men", "women"],
  ),
  product(
    "woven-slide",
    "Woven Slide — Multi",
    21000,
    "1781863065553-e2dfaf6c01a6",
    ["slides", "women"],
  ),
  product(
    "buckle-slide-black",
    "Buckle Slide — Black",
    24000,
    "1625318880107-49baad6765fd",
    ["slides", "men"],
  ),
  product(
    "strap-sandal-orange",
    "Strap Sandal — Orange",
    23000,
    "1741783895531-ccc860eb946a",
    ["women"],
    false,
  ),
  product(
    "suede-slipper",
    "Suede House Slipper",
    32000,
    "1790034552610-b82abce42a36",
    ["slippers", "men", "women"],
  ),
  product(
    "felt-slipper-grey",
    "Felt Slipper — Grey",
    22500,
    "1650307535558-fa2b39ed16eb",
    ["slippers", "women"],
  ),
  product(
    "black-slide",
    "Plain Slide — Black",
    17500,
    "1764471444628-51c4189ec183",
    ["slides", "men"],
  ),
  product(
    "indoor-slipper",
    "Indoor Slipper — Navy",
    15000,
    "1765861046235-25769e9ec5fe",
    ["slippers", "men"],
  ),
  product(
    "leather-sandal-black",
    "Leather Sandal — Black",
    27500,
    "1605445175147-8d2340ea9065",
    ["slides", "men", "women"],
  ),
  product(
    "double-strap-cocoa",
    "Double Strap — Cocoa",
    25000,
    "1628375385879-1af64230c2e1",
    ["slides", "men"],
  ),
];
