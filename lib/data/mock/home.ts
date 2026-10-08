import type { HomeData, HomeProduct } from "../home";

// Mock catalogue for DATA_SOURCE=mock. Images are free Unsplash TEST photos
// (Unsplash License) standing in for real product photography.
const product = (
  handle: string,
  title: string,
  amount: number,
  photoId: string,
  available = true,
): HomeProduct => ({
  id: `mock-${handle}`,
  handle,
  title,
  price: { amount: amount.toFixed(2), currencyCode: "NGN" },
  image: {
    url: `https://images.unsplash.com/photo-${photoId}`,
    alt: title,
  },
  available,
});

const catalogue = [
  product(
    "bar-slide-black-brown",
    "Bar Slide — Black/Brown",
    18500,
    "1585120824848-8a5cd41493d2",
  ),
  product(
    "cross-strap-tan",
    "Cross Strap — Tan",
    19500,
    "1613662632164-7f2b081a5b46",
  ),
  product(
    "buckle-slide-brown",
    "Buckle Slide — Brown",
    26500,
    "1625563206627-7e713d1ac0a8",
  ),
  product(
    "woven-slide",
    "Woven Slide — Multi",
    21000,
    "1781863065553-e2dfaf6c01a6",
  ),
  product(
    "buckle-slide-black",
    "Buckle Slide — Black",
    24000,
    "1625318880107-49baad6765fd",
  ),
  product(
    "strap-sandal-orange",
    "Strap Sandal — Orange",
    23000,
    "1741783895531-ccc860eb946a",
    false,
  ),
  product(
    "suede-slipper",
    "Suede House Slipper",
    32000,
    "1790034552610-b82abce42a36",
  ),
  product(
    "felt-slipper-grey",
    "Felt Slipper — Grey",
    22500,
    "1650307535558-fa2b39ed16eb",
  ),
  product(
    "black-slide",
    "Plain Slide — Black",
    17500,
    "1764471444628-51c4189ec183",
  ),
  product(
    "indoor-slipper",
    "Indoor Slipper — Navy",
    15000,
    "1765861046235-25769e9ec5fe",
  ),
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
