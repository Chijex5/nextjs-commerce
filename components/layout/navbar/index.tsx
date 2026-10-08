import { getMenu } from "lib/database";
import SiteHeader from "./site-header";

export async function Navbar() {
  const menu = await getMenu("main-menu");
  const siteName = process.env.SITE_NAME || "D'FOOTPRINT";

  return <SiteHeader menu={menu} siteName={siteName} />;
}
