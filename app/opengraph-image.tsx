import OpengraphImage from "components/opengraph-image";

export const alt = "D'FOOTPRINT - Handcrafted Footwear from Nigeria";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return OpengraphImage({
    title: "D'FOOTPRINT",
    description:
      "Where every stitch tells a story and every sole carries you further.",
    badge: "Handcrafted Footwear",
    showLogo: false, // title IS the brand name — no need to repeat the logo
  });
}