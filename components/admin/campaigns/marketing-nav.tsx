import { ViewTabs } from "components/admin/ui";

const TABS = [
  { key: "campaigns", label: "Campaigns", href: "/admin/campaigns" },
  {
    key: "automations",
    label: "Automations",
    href: "/admin/campaigns/automations",
  },
  { key: "audience", label: "Audience", href: "/admin/campaigns/audience" },
];

/** Section tabs shared by the email marketing pages. */
export function MarketingNav({
  active,
}: {
  active: "campaigns" | "automations" | "audience";
}) {
  return (
    <div className="mb-6">
      <ViewTabs
        label="Email marketing"
        active={active}
        hrefFor={(key) => TABS.find((t) => t.key === key)!.href}
        views={TABS.map((t) => ({ key: t.key, label: t.label }))}
      />
    </div>
  );
}
