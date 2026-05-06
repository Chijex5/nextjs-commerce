"use client";

import { useState } from "react";
import Link from "next/link";
import { downloadReceiptPdf } from "lib/receipt/generate-receipt-pdf";

type OrderActionsProps = {
  orderNumber: string;
  order: any; // Full order data for PDF generation
};

export default function OrderActions({
  orderNumber,
  order,
}: OrderActionsProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleDownloadReceipt = async () => {
    setIsGeneratingPdf(true);
    setPdfError(null);
    try {
      await downloadReceiptPdf(order);
    } catch (error) {
      console.error("Failed to generate receipt:", error);
      setPdfError("Failed to generate receipt. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  return (
    <>
      <style>{`
        .oa-root {
          border: 1px solid rgba(242,232,213,0.09);
          border-top: none;
          background: rgba(16,12,6,0.7);
          padding: 36px 48px;
          font-family: 'DM Sans', sans-serif;
        }
        .oa-accent {
          height: 1px;
          background: linear-gradient(90deg, #BF5A28 0%, #C0892A 50%, transparent 100%);
          margin-bottom: 28px;
        }
        .oa-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px;
          font-weight: 300;
          color: var(--cream, #F2E8D5);
          margin-bottom: 6px;
        }
        .oa-sub {
          font-size: 13px;
          color: var(--muted, #6A5A48);
          margin-bottom: 24px;
          line-height: 1.6;
        }
        .oa-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        /* Primary CTA */
        .oa-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--terra, #BF5A28);
          border: none;
          color: var(--cream, #F2E8D5);
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 13px 24px;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .oa-btn-primary:hover { background: #a34d22; }

        /* Secondary CTAs */
        .oa-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: 1px solid rgba(242,232,213,0.18);
          color: var(--muted, #6A5A48);
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 13px 24px;
          text-decoration: none;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          flex-shrink: 0;
        }
        .oa-btn-secondary:hover {
          border-color: rgba(242,232,213,0.35);
          color: var(--cream, #F2E8D5);
          background: rgba(242,232,213,0.03);
        }

        @media (max-width: 768px) {
          .oa-root { padding: 24px; }
          .oa-actions { flex-direction: column; }
          .oa-btn-primary,
          .oa-btn-secondary { justify-content: center; }
        }
      `}</style>

      <section className="oa-root">
        <div className="oa-accent" />
        <h2 className="oa-title">Need anything else?</h2>
        <p className="oa-sub">
          Track your update, talk to us, or keep a copy of this receipt.
        </p>

        <div className="oa-actions">
          <Link
            href={`/orders${orderNumber ? `?orderNumber=${encodeURIComponent(orderNumber)}` : ""}`}
            className="oa-btn-primary"
          >
            Track order →
          </Link>
          <Link
            href={`/contact?order=${encodeURIComponent(orderNumber)}`}
            className="oa-btn-secondary"
          >
            Contact support
          </Link>
          <button
            type="button"
            onClick={() => void handleDownloadReceipt()}
            disabled={isGeneratingPdf}
            className="oa-btn-secondary"
            title={pdfError ? "Error generating receipt" : ""}
          >
            {isGeneratingPdf ? "Generating..." : "Download receipt"}
          </button>
          {pdfError && (
            <div
              style={{ fontSize: "12px", color: "#f4b9a2", marginTop: "8px" }}
            >
              {pdfError}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
