import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ── Types ────────────────────────────────────────────────────────────────────

export type DeliveryStatus = "production" | "sorting" | "dispatch" | "completed";

export type ReceiptItem = {
  title: string;
  variant: string;
  qty: number;
  price: number; // plain NGN number e.g. 85000
};

export type ReceiptData = {
  orderNum: string;
  orderDate: string; // ISO string e.g. "2025-05-01"
  status: DeliveryStatus;
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

const C = {
  espresso: "#0A0704",
  charcoal: "#100C06",
  dark: "#140E08",
  darkMid: "#1A140C",
  darkRow: "#1E1510",
  altRow: "#1A140C",
  cream: "#F2E8D5",
  sand: "#C9B99A",
  muted: "#6A5A48",
  terra: "#BF5A28",
  gold: "#C0892A",
  green: "#5DCAA5",
  border: "#2A201A",
};

const normalisePhone = (phone: string): string => {
  // Check if the phone number starts with '0' if not add it
  if (!phone.startsWith("0")) {
    return "0" + phone;
  }
  return phone;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    backgroundColor: C.espresso,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.cream,
  },

  // Header
  header: {
    backgroundColor: C.charcoal,
    borderBottomWidth: 2,
    borderBottomColor: C.terra,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 36,
    paddingVertical: 22,
  },
  logo: { width: 80, height: 40, objectFit: "contain" },
  headerRight: { alignItems: "flex-end" },
  headerLabel: {
    fontSize: 7,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: C.muted,
    marginBottom: 3,
  },
  orderNum: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.gold,
    letterSpacing: 1,
  },
  orderDate: { fontSize: 9, color: C.sand, marginTop: 2 },

  // Status bar
  statusBar: {
    backgroundColor: C.terra,
    paddingHorizontal: 36,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusText: { fontSize: 8, letterSpacing: 1.5, color: C.cream },
  statusBold: { fontFamily: "Helvetica-Bold", color: "#ffffff" },
  trackingText: { fontSize: 8, color: C.cream },
  trackingBold: { fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 0.5 },

  // 2-col info row
  infoRow: {
    flexDirection: "row",
    marginTop: 2,
    gap: 2,
  },
  infoCell: {
    flex: 1,
    backgroundColor: C.dark,
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  infoCellLeft: { borderBottomWidth: 2, borderBottomColor: C.terra },
  infoCellRight: { borderBottomWidth: 2, borderBottomColor: C.gold },
  infoCellLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  infoCellLabelTerra: { color: C.terra },
  infoCellLabelGold: { color: C.gold },
  customerName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.cream, marginBottom: 6 },
  infoValue: { fontSize: 10, color: C.sand, lineHeight: 1.7 },

  // Items table
  tableWrap: { backgroundColor: C.charcoal, marginTop: 2 },
  tableHeader: {
    backgroundColor: C.darkRow,
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 9,
  },
  tableHeadCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: C.muted,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableRowEven: { backgroundColor: C.charcoal },
  tableRowOdd: { backgroundColor: C.altRow },
  cellItem: { flex: 3.2 },
  cellVariant: { flex: 2 },
  cellQty: { flex: 0.8, textAlign: "center" },
  cellUnit: { flex: 1.8, textAlign: "right" },
  cellTotal: { flex: 1.8, textAlign: "right" },
  cellTextPrimary: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.cream },
  cellTextSecondary: { fontSize: 9, color: C.sand },
  cellTextGold: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.gold },

  // Totals
  totalsWrap: {
    backgroundColor: C.dark,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: "flex-end",
  },
  totalsTable: { width: 240 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  totalsLabel: { fontSize: 10, color: C.muted },
  totalsValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.sand },
  totalsDivider: {
    height: 1,
    backgroundColor: C.gold,
    marginVertical: 8,
  },
  grandLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.cream },
  grandValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.gold },
  discountLabel: { fontSize: 10, color: C.green },
  discountValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.green },
  currencyNote: { fontSize: 8, color: C.muted, marginTop: 4, textAlign: "right" },

  // Notes strip
  notesStrip: {
    backgroundColor: C.darkMid,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 24,
    paddingVertical: 11,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  notesText: { fontSize: 8, color: C.muted, letterSpacing: 0.5 },
  notesDot: { fontSize: 12, color: C.terra },

  // Footer
  footer: {
    backgroundColor: C.charcoal,
    paddingHorizontal: 36,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerLeft: {},
  footerOrderNum: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.sand, marginBottom: 3 },
  footerMeta: { fontSize: 8, color: C.muted, lineHeight: 1.7 },
  footerRight: { alignItems: "flex-end" },
  footerPoweredBy: { fontSize: 7, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted, marginBottom: 5 },
  footerLogo: { width: 52, height: 22, objectFit: "contain", opacity: 0.45 },
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
      author="Your Brand"
      subject="Order Receipt"
    >
      <Page size="A4" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <Image src="/d.png" style={s.logo} />
          <View style={s.headerRight}>
            <Text style={s.headerLabel}>Receipt</Text>
            <Text style={s.orderNum}>{data.orderNum}</Text>
            <Text style={s.orderDate}>{dateStr}</Text>
          </View>
        </View>

        {/* ── STATUS BAR ── */}
        <View style={s.statusBar}>
          <Text style={s.statusText}>
            Status: <Text style={s.statusBold}>{STATUS_LABELS[data.status]}</Text>
          </Text>
          {data.tracking ? (
            <Text style={s.trackingText}>
              Tracking:{" "}
              <Text style={s.trackingBold}>{data.tracking}</Text>
            </Text>
          ) : null}
        </View>

        {/* ── CUSTOMER + ADDRESS ── */}
        <View style={s.infoRow}>
          <View style={[s.infoCell, s.infoCellLeft]}>
            <Text style={[s.infoCellLabel, s.infoCellLabelTerra]}>Customer</Text>
            <Text style={s.customerName}>{data.fname} {data.lname}</Text>
            <Text style={s.infoValue}>{normalisePhone(data.phone1)}</Text>
            {data.phone2 ? <Text style={s.infoValue}>{normalisePhone(data.phone2)}</Text> : null}
          </View>
          <View style={[s.infoCell, s.infoCellRight]}>
            <Text style={[s.infoCellLabel, s.infoCellLabelGold]}>Delivery address</Text>
            <Text style={s.infoValue}>{fullAddr || "Not provided"}</Text>
          </View>
        </View>

        {/* ── ITEMS TABLE ── */}
        <View style={s.tableWrap}>
          {/* Table section label */}
          <View style={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 10 }}>
            <Text style={[s.infoCellLabel, s.infoCellLabelTerra]}>Order items</Text>
          </View>

          {/* Column headers */}
          <View style={s.tableHeader}>
            <Text style={[s.tableHeadCell, s.cellItem]}>Item</Text>
            <Text style={[s.tableHeadCell, s.cellVariant]}>Variant</Text>
            <Text style={[s.tableHeadCell, s.cellQty]}>Qty</Text>
            <Text style={[s.tableHeadCell, s.cellUnit]}>Unit price</Text>
            <Text style={[s.tableHeadCell, s.cellTotal]}>Total</Text>
          </View>

          {/* Rows */}
          {data.items.map((item, i) => (
            <View
              key={i}
              style={[s.tableRow, i % 2 === 0 ? s.tableRowEven : s.tableRowOdd]}
            >
              <Text style={[s.cellTextPrimary, s.cellItem]}>{item.title || "—"}</Text>
              <Text style={[s.cellTextSecondary, s.cellVariant]}>{item.variant || "—"}</Text>
              <Text style={[s.cellTextSecondary, s.cellQty]}>{item.qty}</Text>
              <Text style={[s.cellTextSecondary, s.cellUnit]}>{fmtNGN(item.price)}</Text>
              <Text style={[s.cellTextGold, s.cellTotal]}>{fmtNGN(item.qty * item.price)}</Text>
            </View>
          ))}
        </View>

        {/* ── TOTALS ── */}
        <View style={s.totalsWrap}>
          <View style={s.totalsTable}>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Subtotal</Text>
              <Text style={s.totalsValue}>{fmtNGN(sub)}</Text>
            </View>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Shipping</Text>
              <Text style={s.totalsValue}>{fmtNGN(data.shipping)}</Text>
            </View>
            {data.discount > 0 && (
              <View style={s.totalsRow}>
                <Text style={s.discountLabel}>
                  Discount{data.coupon ? ` (${data.coupon})` : ""}
                </Text>
                <Text style={s.discountValue}>- {fmtNGN(data.discount)}</Text>
              </View>
            )}
            <View style={s.totalsDivider} />
            <View style={s.totalsRow}>
              <Text style={s.grandLabel}>Total paid</Text>
              <Text style={s.grandValue}>{fmtNGN(total)}</Text>
            </View>
            <Text style={s.currencyNote}>Currency: Nigerian Naira (NGN)</Text>
          </View>
        </View>

        {/* ── NOTES STRIP ── */}
        <View style={s.notesStrip}>
          <Text style={s.notesText}>Thank you for your order.</Text>
          <Text style={s.notesDot}>·</Text>
          <Text style={s.notesText}>Contact us with your order number for any support.</Text>
        </View>

        {/* ── FOOTER ── */}
        <View style={s.footer}>
          <View style={s.footerLeft}>
            <Text style={s.footerOrderNum}>Order #{data.orderNum}</Text>
            <Text style={s.footerMeta}>Issued: {dateStr}</Text>
            <Text style={s.footerMeta}>
              This receipt is auto-generated and valid without a signature.
            </Text>
          </View>
          <View style={s.footerRight}>
            <Text style={s.footerPoweredBy}>Powered by</Text>
            <Image src="/d.png" style={s.footerLogo} />
          </View>
        </View>

      </Page>
    </Document>
  );
}