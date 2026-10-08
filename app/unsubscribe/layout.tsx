import "../editorial-bridge.css";

export default function UnsubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="ed-bridge">{children}</div>;
}
