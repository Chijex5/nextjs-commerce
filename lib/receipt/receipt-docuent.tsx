import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { type DeliveryStatus } from "lib/order-utils/delivery-tracking";

// ── Types ────────────────────────────────────────────────────────────────────

export type ReceiptItem = {
  title: string;
  variant: string;
  qty: number;
  price: number; // plain NGN number e.g. 85000
};

export type ReceiptData = {
  orderNum: string;
  orderDate: string; // ISO string e.g. "2025-05-01"
  status: DeliveryStatus; // Imported from lib/order-utils/delivery-tracking
  tracking?: string | null;
  // Customer
  fname: string;
  lname: string;
  phone1: string;
  phone2?: string | null;
  // Address
  street?: string | null;
  busstop?: string | null;
  lga?: string | null;
  state?: string | null;
  landmark?: string | null;
  // Financials
  shipping: number;
  discount: number;
  coupon?: string | null;
  // Items
  items: ReceiptItem[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  production: "In production",
  sorting: "Packed",
  dispatch: "Dispatched",
  completed: "Delivered",
  paused: "Temporarily paused",
  cancelled: "Cancelled",
};

function fmtNGN(n: number): string {
  return (
    "NGN " +
    Number(n).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ── Palette ──────────────────────────────────────────────────────────────────
// Black & white street editorial: white page, black type, grey only for
// secondary text and hairlines. Courier stands in for the site's mono labels
// and Helvetica-Bold (uppercase, tight) for the condensed display face, so
// the PDF never has to fetch fonts.

const C = {
  ink: "#000000",
  paper: "#FFFFFF",
  grey: "#6B6B6B",
  hairline: "#D9D9D9",
};

const normalisePhone = (phone: string): string => {
  // Check if the phone number starts with '0' if not add it
  if (!phone.startsWith("0")) {
    return "0" + phone;
  }
  return phone;
};

// ── Styles ───────────────────────────────────────────────────────────────────

const mono = {
  fontFamily: "Courier",
  fontSize: 7.5,
  letterSpacing: 1.2,
  textTransform: "uppercase" as const,
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.paper,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.ink,
    paddingHorizontal: 40,
    paddingTop: 36,
    paddingBottom: 40,
  },

  // Masthead
  topline: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  label: { ...mono, color: C.grey },
  labelInk: { ...mono, color: C.ink },
  masthead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 14,
    borderBottomWidth: 3,
    borderBottomColor: C.ink,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 38, height: 38, objectFit: "contain" },
  wordmark: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 44,
    lineHeight: 0.9,
    letterSpacing: -1.5,
    textTransform: "uppercase",
    textAlign: "right",
  },

  // Order meta strip
  metaRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.ink,
  },
  metaCell: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 10,
  },
  metaValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginTop: 4,
    textTransform: "uppercase",
  },

  // Customer + address
  infoRow: {
    flexDirection: "row",
    gap: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.ink,
  },
  infoCell: { flex: 1 },
  customerName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    textTransform: "uppercase",
    marginTop: 6,
    marginBottom: 4,
  },
  infoValue: { fontSize: 10, lineHeight: 1.6, marginTop: 6 },
  infoValueTight: { fontSize: 10, lineHeight: 1.6 },

  // Items table
  sectionLabel: { ...mono, color: C.ink, marginTop: 22, marginBottom: 8 },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: C.ink,
    borderBottomWidth: 1,
    borderBottomColor: C.ink,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.hairline,
  },
  cellItem: { flex: 3.2, paddingRight: 8 },
  cellVariant: { flex: 2, paddingRight: 8 },
  cellQty: { flex: 0.7, textAlign: "center" },
  cellUnit: { flex: 1.8, textAlign: "right" },
  cellTotal: { flex: 1.8, textAlign: "right" },
  cellTextPrimary: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    textTransform: "uppercase",
  },
  cellTextSecondary: { fontSize: 9.5, color: C.grey },
  cellNumber: { fontSize: 9.5 },
  cellNumberBold: { fontFamily: "Helvetica-Bold", fontSize: 10 },

  // Totals
  totalsWrap: { alignItems: "flex-end", marginTop: 16 },
  totalsTable: { width: 250 },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalsLabel: { fontSize: 10, color: C.grey },
  totalsValue: { fontSize: 10 },
  grandBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.ink,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  grandLabel: { ...mono, color: C.paper },
  grandValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    color: C.paper,
  },
  currencyNote: { ...mono, color: C.grey, marginTop: 6, textAlign: "right" },

  // Footer
  footer: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 32,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.ink,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerText: { fontSize: 8, color: C.grey, lineHeight: 1.6 },
  thanks: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    lineHeight: 0.95,
    letterSpacing: -0.5,
    textTransform: "uppercase",
    textAlign: "right",
  },
});

// ── Component ─────────────────────────────────────────────────────────────────

export function ReceiptDocument({ data }: { data: ReceiptData }) {
  const sub = data.items.reduce((s, it) => s + it.qty * it.price, 0);
  const total = Math.max(sub + data.shipping - data.discount, 0);
  const dateStr = formatDate(data.orderDate);

  const fullAddr = [
    data.street,
    data.busstop ? "Near " + data.busstop : null,
    data.landmark,
    data.lga,
    data.state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Document
      title={`Receipt — ${data.orderNum}`}
      author="D'FOOTPRINT"
      subject="Order Receipt"
    >
      <Page size="A4" style={s.page}>
        {/* ── TOP LINE ── */}
        <View style={s.topline}>
          <Text style={s.label}>Handmade footwear / Lagos</Text>
          <Text style={s.label}>dfootprint.me</Text>
        </View>

        {/* ── MASTHEAD ── */}
        <View style={s.masthead}>
          <View style={s.brand}>
            <Image src="/brand/logo-mark-black.png" style={s.logo} />
            <Text style={s.wordmark}>D&apos;Footprint</Text>
          </View>
          <Text style={s.title}>Receipt</Text>
        </View>

        {/* ── ORDER META ── */}
        <View style={s.metaRow}>
          <View style={s.metaCell}>
            <Text style={s.label}>Order no.</Text>
            <Text style={s.metaValue}>{data.orderNum}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.label}>Date</Text>
            <Text style={s.metaValue}>{dateStr}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.label}>Status</Text>
            <Text style={s.metaValue}>{STATUS_LABELS[data.status]}</Text>
          </View>
          {data.tracking ? (
            <View style={s.metaCell}>
              <Text style={s.label}>Tracking</Text>
              <Text style={s.metaValue}>{data.tracking}</Text>
            </View>
          ) : null}
        </View>

        {/* ── CUSTOMER + ADDRESS ── */}
        <View style={s.infoRow}>
          <View style={s.infoCell}>
            <Text style={s.label}>Customer</Text>
            <Text style={s.customerName}>
              {data.fname} {data.lname}
            </Text>
            <Text style={s.infoValueTight}>{normalisePhone(data.phone1)}</Text>
            {data.phone2 ? (
              <Text style={s.infoValueTight}>
                {normalisePhone(data.phone2)}
              </Text>
            ) : null}
          </View>
          <View style={s.infoCell}>
            <Text style={s.label}>Delivery address</Text>
            <Text style={s.infoValue}>{fullAddr || "Not provided"}</Text>
          </View>
        </View>

        {/* ── ITEMS TABLE ── */}
        <Text style={s.sectionLabel}>
          Order items ({data.items.reduce((n, it) => n + it.qty, 0)})
        </Text>
        <View style={s.tableHeader}>
          <Text style={[s.label, s.cellItem]}>Item</Text>
          <Text style={[s.label, s.cellVariant]}>Variant</Text>
          <Text style={[s.label, s.cellQty]}>Qty</Text>
          <Text style={[s.label, s.cellUnit]}>Unit price</Text>
          <Text style={[s.label, s.cellTotal]}>Total</Text>
        </View>
        {data.items.map((item, i) => (
          <View key={i} style={s.tableRow} wrap={false}>
            <Text style={[s.cellTextPrimary, s.cellItem]}>
              {item.title || "—"}
            </Text>
            <Text style={[s.cellTextSecondary, s.cellVariant]}>
              {item.variant || "—"}
            </Text>
            <Text style={[s.cellNumber, s.cellQty]}>{item.qty}</Text>
            <Text style={[s.cellNumber, s.cellUnit]}>{fmtNGN(item.price)}</Text>
            <Text style={[s.cellNumberBold, s.cellTotal]}>
              {fmtNGN(item.qty * item.price)}
            </Text>
          </View>
        ))}

        {/* ── TOTALS ── */}
        <View style={s.totalsWrap} wrap={false}>
          <View style={s.totalsTable}>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Subtotal</Text>
              <Text style={s.totalsValue}>{fmtNGN(sub)}</Text>
            </View>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Shipping</Text>
              <Text style={s.totalsValue}>
                {data.shipping > 0 ? fmtNGN(data.shipping) : "Free"}
              </Text>
            </View>
            {data.discount > 0 && (
              <View style={s.totalsRow}>
                <Text style={s.totalsLabel}>
                  Discount{data.coupon ? ` (${data.coupon})` : ""}
                </Text>
                <Text style={s.totalsValue}>- {fmtNGN(data.discount)}</Text>
              </View>
            )}
            <View style={s.grandBox}>
              <Text style={s.grandLabel}>Total paid</Text>
              <Text style={s.grandValue}>{fmtNGN(total)}</Text>
            </View>
            <Text style={s.currencyNote}>Nigerian Naira (NGN)</Text>
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={s.footer} fixed>
          <View>
            <Text style={s.footerText}>
              Questions? Reply to your order email or quote order{" "}
              {data.orderNum}.
            </Text>
            <Text style={s.footerText}>
              Auto-generated receipt, valid without a signature.
            </Text>
          </View>
          <Text style={s.thanks}>Made by hand.{"\n"}Thank you.</Text>
        </View>
      </Page>
    </Document>
  );
}
