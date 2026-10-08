import "../editorial-bridge.css";

export default function CareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="ed-bridge">{children}</div>;
}
