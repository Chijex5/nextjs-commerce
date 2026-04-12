import Price from "components/price";

type SummaryItem = { id: string; name: string; amount: string };

type OrderFinancialSummaryProps = {
  items: SummaryItem[];
  currencyCode: string;
  shippingAmount: string;
  discountAmount: string;
  couponCode?: string | null;
  totalPaid: string;
};

export default function OrderFinancialSummary({
  items,
  currencyCode,
  shippingAmount,
  discountAmount,
  couponCode,
  totalPaid,
}: OrderFinancialSummaryProps) {
  const hasDiscount = Number(discountAmount) > 0;

  return (
    <>
      <style>{`
        .ofs-root {
          border: 1px solid rgba(242,232,213,0.09);
          border-top: none;
          background: rgba(16,12,6,0.7);
          padding: 36px 48px;
          font-family: 'DM Sans', sans-serif;
        }
        .ofs-accent {
          height: 1px;
          background: linear-gradient(90deg, #BF5A28 0%, #C0892A 50%, transparent 100%);
          margin-bottom: 28px;
        }
        .ofs-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px;
          font-weight: 300;
          color: var(--cream, #F2E8D5);
          margin-bottom: 24px;
        }

        /* ── LINE ITEMS ── */
        .ofs-lines {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 2px;
        }
        .ofs-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: rgba(242,232,213,0.02);
          border: 1px solid rgba(242,232,213,0.06);
          padding: 14px 18px;
        }
        .ofs-line-name {
          font-size: 13px;
          color: var(--sand, #C9B99A);
          flex: 1;
          min-width: 0;
        }
        .ofs-line-amount p,
        .ofs-line-amount span {
          color: var(--cream, #F2E8D5) !important;
          font-size: 13px !important;
          font-weight: 500 !important;
        }

        /* ── TOTALS BLOCK ── */
        .ofs-totals {
          border: 1px solid rgba(242,232,213,0.09);
          background: rgba(242,232,213,0.02);
          margin-top: 2px;
        }
        .ofs-total-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(242,232,213,0.06);
        }
        .ofs-total-row:last-child { border-bottom: none; }
        .ofs-total-label {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted, #6A5A48);
        }
        .ofs-total-value p,
        .ofs-total-value span {
          color: var(--cream, #F2E8D5) !important;
          font-size: 13px !important;
          font-weight: 500 !important;
        }
        .ofs-total-value-discount p,
        .ofs-total-value-discount span {
          color: #6abf6e !important;
          font-size: 13px !important;
          font-weight: 500 !important;
        }

        /* ── GRAND TOTAL ── */
        .ofs-grand {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 18px;
          border-top: 1px solid rgba(191,90,40,0.3);
          background: rgba(191,90,40,0.05);
          margin-top: 2px;
        }
        .ofs-grand-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--terra, #BF5A28);
        }
        .ofs-grand-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 400;
          color: var(--gold, #C0892A);
        }
        .ofs-grand-value p,
        .ofs-grand-value span {
          color: var(--gold, #C0892A) !important;
          font-family: 'Cormorant Garamond', serif !important;
          font-size: 24px !important;
          font-weight: 400 !important;
        }

        @media (max-width: 768px) {
          .ofs-root { padding: 24px; }
        }
      `}</style>

      <section className="ofs-root">
        <div className="ofs-accent" />
        <h2 className="ofs-title">Order summary</h2>

        {/* Line items */}
        <div className="ofs-lines">
          {items.map((item) => (
            <div key={item.id} className="ofs-line">
              <span className="ofs-line-name">{item.name}</span>
              <div className="ofs-line-amount">
                <Price
                  amount={item.amount}
                  currencyCode={currencyCode}
                  currencyCodeClassName="hidden"
                  className="inline"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Shipping + discount */}
        <div className="ofs-totals">
          <div className="ofs-total-row">
            <span className="ofs-total-label">Delivery</span>
            <div className="ofs-total-value">
              <Price
                amount={shippingAmount}
                currencyCode={currencyCode}
                currencyCodeClassName="hidden"
                className="inline"
              />
            </div>
          </div>

          {hasDiscount && (
            <div className="ofs-total-row">
              <span className="ofs-total-label">
                Promo{couponCode ? ` · ${couponCode}` : ""}
              </span>
              <div className="ofs-total-value-discount">
                <Price
                  amount={`-${Math.abs(Number(discountAmount)).toFixed(2)}`}
                  currencyCode={currencyCode}
                  currencyCodeClassName="hidden"
                  className="inline"
                />
              </div>
            </div>
          )}
        </div>

        {/* Grand total */}
        <div className="ofs-grand">
          <span className="ofs-grand-label">Total paid</span>
          <div className="ofs-grand-value">
            <Price
              amount={totalPaid}
              currencyCode={currencyCode}
              currencyCodeClassName="hidden"
              className="inline"
            />
          </div>
        </div>
      </section>
    </>
  );
}