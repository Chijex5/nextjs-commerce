export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 pb-10 pt-8 md:px-6 md:pb-16 md:pt-10 lg:px-8">
      {children}
    </div>
  );
}
