import OpengraphImage from "components/opengraph-image";

export const alt = "D'FOOTPRINT - Handcrafted in Nigeria";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return OpengraphImage({
    title: "VANTOR SLIDE",
    description:
      "Where every stitch tells a story and every sole carries you further.",
    badge: "PREMIUM SLIDES",
    price: "₦19,000.00",
    showLogo: true,
  });
}
