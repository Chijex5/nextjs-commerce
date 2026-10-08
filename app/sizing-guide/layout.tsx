import "../editorial-bridge.css";

export default function SizingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="ed-bridge">{children}</div>;
}
