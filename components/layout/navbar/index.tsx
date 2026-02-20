import { getMenu } from "lib/database";
import NavbarClient from "./navbar-client";

export async function Navbar() {
  const menu = await getMenu("main-menu");
  const { SITE_NAME } = process.env;

  return <NavbarClient menu={menu} siteName={SITE_NAME} />;
}
