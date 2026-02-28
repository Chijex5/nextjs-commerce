"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Price from "components/price";

type Quote = {
  id: string;
  requestId: string;
  version: number;
  amount: string;
  currencyCode: string;
  note?: string | null;
  status: string;
  expiresAt?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

type RequestItem = {
  id: string;
  requestNumber: string;
  customerName: string;
  email: string;
  phone?: string | null;
  title: string;
  description: string;
  sizeNotes?: string | null;
  colorPreferences?: string | null;
  status: string;
  adminNotes?: string | null;
  quotedAmount?: string | null;
  currencyCode: string;
  quoteExpiresAt?: string | null;
  paidAt?: string | null;
  convertedOrderId?: string | null;
  createdAt: string;
  updatedAt: string;
  referenceImages: string[];
  quotes: Quote[];
};

const REQUEST_STATUS_OPTIONS = [
  "submitted",
  "under_review",
  "quoted",
  "awaiting_payment",
  "paid",
  "in_production",
  "completed",
  "cancelled",
  "rejected",
];

const QUOTE_STATUS_OPTIONS = ["sent", "accepted", "rejected", "expired", "paid"];

export default function CustomOrderRequestsManagement({
  requests,
}: {
  requests: RequestItem[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(requests[0]?.id || "");
  const [isSaving, setIsSaving] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    amount: "",
    note: "",
    expiresAt: "",
  });
  const [statusForm, setStatusForm] = useState({
    status: requests[0]?.status || "submitted",
    adminNotes: requests[0]?.adminNotes || "",
  });

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedId) || null,
    [requests, selectedId],
  );

  const handleSelectRequest = (request: RequestItem) => {
    setSelectedId(request.id);
    setStatusForm({
      status: request.status,
      adminNotes: request.adminNotes || "",
    });
  };

  const saveRequestUpdates = async () => {
    if (!selectedRequest) return;
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/admin/custom-order-requests/${selectedRequest.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: statusForm.status,
            adminNotes: statusForm.adminNotes,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update request");
        return;
      }
      toast.success("Request updated");
      router.refresh();
    } catch {
      toast.error("Failed to update request");
    } finally {
      setIsSaving(false);
    }
  };

  const createQuote = async () => {
    if (!selectedRequest) return;
    const amount = Number(quoteForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid quote amount");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/admin/custom-order-requests/${selectedRequest.id}/quotes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            currencyCode: selectedRequest.currencyCode || "NGN",
            note: quoteForm.note,
            expiresAt: quoteForm.expiresAt || undefined,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to create quote");
        return;
      }
      toast.success("Quote created and sent");
      setQuoteForm({ amount: "", note: "", expiresAt: "" });
      router.refresh();
    } catch {
      toast.error("Failed to create quote");
    } finally {
      setIsSaving(false);
    }
  };

  const updateQuoteStatus = async (quoteId: string, status: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/custom-order-quotes/${quoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update quote");
        return;
      }
      toast.success("Quote updated");
      router.refresh();
    } catch {
      toast.error("Failed to update quote");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Request Queue
          </h2>
        </div>
        {requests.length === 0 ? (
          <div className="p-6 text-sm text-neutral-500 dark:text-neutral-400">
            No custom requests yet.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {requests.map((request) => (
              <button
                key={request.id}
                onClick={() => handleSelectRequest(request)}
                className={`w-full px-4 py-4 text-left transition ${
                  request.id === selectedId
                    ? "bg-neutral-100 dark:bg-neutral-800"
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800/70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {request.requestNumber}
                    </p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                      {request.title}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {request.customerName} · {request.email}
                    </p>
                  </div>
                  <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
                    {request.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          {selectedRequest ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                  {selectedRequest.requestNumber}
                </p>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {selectedRequest.title}
                </h3>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {selectedRequest.description}
                </p>
              </div>

              <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                <p>{selectedRequest.customerName}</p>
                <p>{selectedRequest.email}</p>
                {selectedRequest.phone ? <p>{selectedRequest.phone}</p> : null}
              </div>

              <div className="grid gap-3">
                <select
                  value={statusForm.status}
                  onChange={(event) =>
                    setStatusForm((prev) => ({ ...prev, status: event.target.value }))
                  }
                  className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                >
                  {REQUEST_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <textarea
                  rows={4}
                  value={statusForm.adminNotes}
                  onChange={(event) =>
                    setStatusForm((prev) => ({
                      ...prev,
                      adminNotes: event.target.value,
                    }))
                  }
                  placeholder="Admin notes"
                  className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                />
                <button
                  onClick={saveRequestUpdates}
                  disabled={isSaving}
                  className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  Save request
                </button>
              </div>

              {selectedRequest.referenceImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {selectedRequest.referenceImages.map((image) => (
                    <a
                      key={image}
                      href={image}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700"
                    >
                      {image}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Select a request to manage it.
            </p>
          )}
        </div>

        {selectedRequest ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
              Create quote
            </h3>
            <div className="mt-3 space-y-3">
              <input
                type="number"
                min="0"
                value={quoteForm.amount}
                onChange={(event) =>
                  setQuoteForm((prev) => ({ ...prev, amount: event.target.value }))
                }
                placeholder="Amount (NGN)"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              />
              <input
                type="datetime-local"
                value={quoteForm.expiresAt}
                onChange={(event) =>
                  setQuoteForm((prev) => ({
                    ...prev,
                    expiresAt: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              />
              <textarea
                rows={3}
                value={quoteForm.note}
                onChange={(event) =>
                  setQuoteForm((prev) => ({ ...prev, note: event.target.value }))
                }
                placeholder="Quote note (optional)"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              />
              <button
                onClick={createQuote}
                disabled={isSaving}
                className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Send quote
              </button>
            </div>
          </div>
        ) : null}

        {selectedRequest ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
              Quotes
            </h3>
            {selectedRequest.quotes.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                No quotes yet.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {selectedRequest.quotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        V{quote.version}
                      </p>
                      <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        {quote.status}
                      </span>
                    </div>
                    <Price
                      amount={quote.amount}
                      currencyCode={quote.currencyCode}
                      currencyCodeClassName="hidden"
                      className="mt-1 text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                    />
                    {quote.note ? (
                      <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                        {quote.note}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {QUOTE_STATUS_OPTIONS.map((status) => (
                        <button
                          key={status}
                          onClick={() => updateQuoteStatus(quote.id, status)}
                          disabled={isSaving || status === quote.status}
                          className="rounded-full border border-neutral-300 px-2 py-1 text-[11px] font-medium uppercase tracking-wide hover:border-neutral-500 disabled:opacity-50 dark:border-neutral-700 dark:hover:border-neutral-500"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
