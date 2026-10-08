/**
 * Editorial photography for the home page.
 *
 * TEST IMAGES: everything below is a free Unsplash photo (Unsplash License —
 * free for commercial use, no attribution required) used to judge the design
 * until D'FOOTPRINT's own shoot is ready. Replace `src` values with your own
 * photos; nothing else needs to change. The `source` link is kept so each
 * photo can be traced back.
 */

export type Photo = { src: string; alt: string; source: string };

const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const HERO_PHOTOS: Photo[] = [
  {
    src: u("1748765212717-4c5f304be1c1"),
    alt: "Feet in slides hanging from a ledge, black and white",
    source: "https://unsplash.com/photos/MNIRGW2JNgA",
  },
  {
    src: u("1639646259885-585a1113bfde"),
    alt: "Man in white sitting on a concrete block at night, wearing slides",
    source: "https://unsplash.com/photos/N_7yCXpT0Hs",
  },
  {
    src: u("1628375385879-1af64230c2e1"),
    alt: "Feet in black leather slides and white trousers",
    source: "https://unsplash.com/photos/LyJAczPSwo0",
  },
];

export const MANIFESTO_PHOTOS: Photo[] = [
  {
    src: u("1477517787936-70ba786643fd"),
    alt: "Hands cutting a shoe pattern",
    source: "https://unsplash.com/photos/2JtF6pYAOOI",
  },
  {
    src: u("1572816225927-d08fb138f2b2"),
    alt: "Busy Lagos street with yellow buses",
    source: "https://unsplash.com/photos/K32RRhbupME",
  },
  {
    src: u("1765961999112-7aea89449b62"),
    alt: "A wall of handmade leather sandals",
    source: "https://unsplash.com/photos/cqOaumDYUac",
  },
];

export const CITY_PHOTO: Photo = {
  src: u("1648023199223-25d3622bcb13"),
  alt: "Aerial view of Lagos traffic and yellow danfo buses",
  source: "https://unsplash.com/photos/cFT_Xq4XyA0",
};

export type Look = Photo & { caption: string; href: string };

export const LOOKS: Look[] = [
  {
    src: u("1605445175147-8d2340ea9065"),
    alt: "Feet in black leather slides on a white floor",
    source: "https://unsplash.com/photos/n2vMMkNivwU",
    caption: "Double band slide",
    href: "/products",
  },
  {
    src: u("1531123414780-f74242c2b052"),
    alt: "Woman smiling in front of a red wall",
    source: "https://unsplash.com/photos/LWkFHEGpleE",
    caption: "Weekend, Lagos",
    href: "/products",
  },
  {
    src: u("1764698072685-f01c10bd2dca"),
    alt: "Man in black sitting on the floor, black and white",
    source: "https://unsplash.com/photos/CCeLjq86Qi8",
    caption: "All black",
    href: "/products",
  },
  {
    src: u("1708170236295-20ab8fbadcef"),
    alt: "Woman in an orange top crouching on a city street",
    source: "https://unsplash.com/photos/yjwehHiMGpg",
    caption: "Street",
    href: "/products",
  },
  {
    src: u("1578880711834-5cb67ff7bde3"),
    alt: "Man sitting inside a large letter O sculpture",
    source: "https://unsplash.com/photos/ljBMNgMUYZ8",
    caption: "Off duty",
    href: "/products",
  },
  {
    src: u("1782171059880-1f6d8eb0cf52"),
    alt: "Bearded man in sunglasses on a black stool",
    source: "https://unsplash.com/photos/ce1_DVlZY30",
    caption: "Studio",
    href: "/products",
  },
];

export const CRAFT_PHOTOS: Photo[] = [
  {
    src: u("1477517787936-70ba786643fd"),
    alt: "Hands cutting a pattern with a knife",
    source: "https://unsplash.com/photos/2JtF6pYAOOI",
  },
  {
    src: u("1653868249587-284b275a1c67"),
    alt: "Hands finishing a pair of brown shoes",
    source: "https://unsplash.com/photos/PCdPvFQg1DA",
  },
  {
    src: u("1707109322343-3fe79f5d5c0b"),
    alt: "A pair of shoes being worked on at a table",
    source: "https://unsplash.com/photos/DqHhn-N2Nt0",
  },
  {
    src: u("1768212565222-7d444bdbf4b5"),
    alt: "Rows of decorated sandals on shelves",
    source: "https://unsplash.com/photos/JvKNI7yHbz0",
  },
];

export const CUSTOM_PHOTO: Photo = {
  src: u("1501851602203-f40cf2f11ba9"),
  alt: "Rows of handmade sandals laid out on white cloth",
  source: "https://unsplash.com/photos/I7GHd8PlZqc",
};
