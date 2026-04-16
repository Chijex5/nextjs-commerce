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

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-blue-50 text-blue-800 border-blue-200",
  under_review: "bg-amber-50 text-amber-800 border-amber-200",
  quoted: "bg-purple-50 text-purple-800 border-purple-200",
  awaiting_payment: "bg-orange-50 text-orange-800 border-orange-200",
  paid: "bg-green-50 text-green-800 border-green-200",
  in_production: "bg-teal-50 text-teal-800 border-teal-200",
  completed: "bg-green-50 text-green-900 border-green-200",
  cancelled: "bg-neutral-100 text-neutral-600 border-neutral-200",
  rejected: "bg-red-50 text-red-800 border-red-200",
  sent: "bg-blue-50 text-blue-800 border-blue-200",
  accepted: "bg-green-50 text-green-800 border-green-200",
  expired: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-neutral-100 text-neutral-600 border-neutral-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide ${style}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{hint}</p>
      )}
    </div>
  );
}

type Tab = "details" | "quote" | "history";

export default function CustomOrderRequestsManagement({
  requests,
}: {
  requests: RequestItem[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(requests[0]?.id || "");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("details");
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
    setActiveTab("details");
    setStatusForm({
      status: request.status,
      adminNotes: request.adminNotes || "",
    });
    setQuoteForm({ amount: "", note: "", expiresAt: "" });
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

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "details", label: "Details" },
    { id: "quote", label: "Send quote" },
    {
      id: "history",
      label: "Quote history",
      count: selectedRequest?.quotes.length,
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:grid lg:grid-cols-[300px_1fr]">
      {/* ── Queue sidebar ── */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Request queue
          </h2>
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
            {requests.length}
          </span>
        </div>

        {requests.length === 0 ? (
          <p className="p-6 text-sm text-neutral-400 dark:text-neutral-500">
            No custom requests yet.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {requests.map((request) => (
              <button
                key={request.id}
                onClick={() => handleSelectRequest(request)}
                className={`group w-full px-4 py-3.5 text-left transition-colors ${
                  request.id === selectedId
                    ? "border-l-2 border-purple-500 bg-neutral-50 dark:bg-neutral-800/60"
                    : "border-l-2 border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
                    {request.requestNumber}
                  </span>
                  <StatusBadge status={request.status} />
                </div>
                <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {request.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {request.customerName} · {request.email}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Detail panel ── */}
      {selectedRequest ? (
        <div className="flex min-h-0 flex-col">
          {/* Header */}
          <div className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <p className="mb-1 font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
              {selectedRequest.requestNumber}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {selectedRequest.title}
              </h3>
              <StatusBadge status={selectedRequest.status} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-neutral-200 px-6 dark:border-neutral-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 border-b-2 px-1 py-3 text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-purple-500 font-medium text-purple-600 dark:text-purple-400"
                    : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                } mr-5 last:mr-0`}
              >
                {tab.label}
                {typeof tab.count === "number" && tab.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      activeTab === tab.id
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                        : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto p-6">
            {/* ── Details tab ── */}
            {activeTab === "details" && (
              <div className="space-y-6">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                    Customer
                  </p>
                  <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Name</p>
                      <p className="mt-0.5 text-sm text-neutral-900 dark:text-neutral-100">
                        {selectedRequest.customerName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Email</p>
                      <p className="mt-0.5 break-all text-sm text-neutral-900 dark:text-neutral-100">
                        {selectedRequest.email}
                      </p>
                    </div>
                    {selectedRequest.phone && (
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Phone</p>
                        <p className="mt-0.5 text-sm text-neutral-900 dark:text-neutral-100">
                          {selectedRequest.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-5 dark:border-neutral-800">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                    Request details
                  </p>
                  <p className="mb-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {selectedRequest.description}
                  </p>
                  <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    {selectedRequest.sizeNotes && (
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Size notes
                        </p>
                        <p className="mt-0.5 text-sm text-neutral-900 dark:text-neutral-100">
                          {selectedRequest.sizeNotes}
                        </p>
                      </div>
                    )}
                    {selectedRequest.colorPreferences && (
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Colour preferences
                        </p>
                        <p className="mt-0.5 text-sm text-neutral-900 dark:text-neutral-100">
                          {selectedRequest.colorPreferences}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedRequest.referenceImages.length > 0 && (
                  <div className="border-t border-neutral-100 pt-5 dark:border-neutral-800">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                      Reference images
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.referenceImages.map((image) => (
                        <a
                          key={image}
                          href={image}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-neutral-200"
                        >
                          {image}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-neutral-100 pt-5 dark:border-neutral-800">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                    Status &amp; admin notes
                  </p>
                  <div className="space-y-4">
                    <FieldGroup label="Request status">
                      <select
                        value={statusForm.status}
                        onChange={(e) =>
                          setStatusForm((prev) => ({ ...prev, status: e.target.value }))
                        }
                        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      >
                        {REQUEST_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </FieldGroup>

                    <FieldGroup
                      label="Admin notes"
                      hint="Visible only to admins — not shown to the customer"
                    >
                      <textarea
                        rows={4}
                        value={statusForm.adminNotes}
                        onChange={(e) =>
                          setStatusForm((prev) => ({
                            ...prev,
                            adminNotes: e.target.value,
                          }))
                        }
                        placeholder="Add internal notes about this request…"
                        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                      />
                    </FieldGroup>

                    <button
                      onClick={saveRequestUpdates}
                      disabled={isSaving}
                      className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
                    >
                      {isSaving ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Send quote tab ── */}
            {activeTab === "quote" && (
              <div className="max-w-md space-y-4">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Send a new quote for{" "}
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {selectedRequest.requestNumber}
                  </span>
                  . The customer will be notified.
                </p>

                <FieldGroup
                  label={`Amount (${selectedRequest.currencyCode || "NGN"})`}
                  hint={`Enter the full quoted price in ${selectedRequest.currencyCode || "NGN"}`}
                >
                  <input
                    type="number"
                    min="0"
                    value={quoteForm.amount}
                    onChange={(e) =>
                      setQuoteForm((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    placeholder="e.g. 250000"
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                  />
                </FieldGroup>

                <FieldGroup
                  label="Quote expiry date"
                  hint="Leave blank if this quote does not expire"
                >
                  <input
                    type="datetime-local"
                    value={quoteForm.expiresAt}
                    onChange={(e) =>
                      setQuoteForm((prev) => ({ ...prev, expiresAt: e.target.value }))
                    }
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </FieldGroup>

                <FieldGroup
                  label="Note to customer"
                  hint="Optional — describe what's included, any caveats, or next steps"
                >
                  <textarea
                    rows={4}
                    value={quoteForm.note}
                    onChange={(e) =>
                      setQuoteForm((prev) => ({ ...prev, note: e.target.value }))
                    }
                    placeholder="e.g. Includes two fitting sessions and premium imported fabric."
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                  />
                </FieldGroup>

                <button
                  onClick={createQuote}
                  disabled={isSaving}
                  className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
                >
                  {isSaving ? "Sending…" : "Send quote to customer"}
                </button>
              </div>
            )}

            {/* ── Quote history tab ── */}
            {activeTab === "history" && (
              <div>
                {selectedRequest.quotes.length === 0 ? (
                  <p className="py-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
                    No quotes sent yet for this request.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedRequest.quotes.map((quote) => (
                      <div
                        key={quote.id}
                        className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Version {quote.version}
                          </span>
                          <StatusBadge status={quote.status} />
                        </div>

                        <Price
                          amount={quote.amount}
                          currencyCode={quote.currencyCode}
                          currencyCodeClassName="hidden"
                          className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
                        />

                        {quote.note && (
                          <p className="mt-1.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                            {quote.note}
                          </p>
                        )}

                        {quote.expiresAt && (
                          <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                            Expires {new Date(quote.expiresAt).toLocaleDateString()}
                          </p>
                        )}

                        <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                          <p className="mb-2 text-[11px] text-neutral-400 dark:text-neutral-500">
                            Mark as:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {QUOTE_STATUS_OPTIONS.map((status) => (
                              <button
                                key={status}
                                onClick={() => updateQuoteStatus(quote.id, status)}
                                disabled={isSaving || status === quote.status}
                                className="rounded-full border border-neutral-200 px-3 py-1 text-[11px] font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-neutral-200"
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center p-12">
          <p className="text-sm text-neutral-400 dark:text-neutral-500">
            Select a request from the queue to manage it.
          </p>
        </div>
      )}
    </div>
  );
}